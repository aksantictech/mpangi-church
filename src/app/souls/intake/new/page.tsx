import Link from "next/link";
import { ArrowLeft, HeartHandshake, UserPlus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createSoulIntakeAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ error?: string }> };

const input = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function NewSoulIntakePage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("souls");

  const { data: assignees } = await admin
    .from("profiles")
    .select("id,full_name,role,status")
    .eq("church_id", profile.church_id)
    .eq("status", "active")
    .order("full_name");

  const errorMessage = params.error
    ? params.error === "assignee"
      ? "Le responsable de suivi sélectionné n’est pas valide."
      : params.error === "save" || params.error === "followup"
        ? "Impossible d’enregistrer l’accueil et le suivi. Vérifiez la migration Supabase."
        : "Complétez tous les champs obligatoires et sélectionnez au moins un type."
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/souls/intake" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" /> Retour à l’accueil des âmes
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><UserPlus className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Volet spirituel</p>
              <h1 className="mt-2 text-3xl font-black">Accueil des âmes</h1>
              <p className="mt-2 max-w-3xl text-sm text-blue-50">
                Enregistrez les nouveaux venus et nouveaux convertis et affectez immédiatement une personne au suivi.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>}

        <form action={createSoulIntakeAction} className="space-y-5">
          <FormSection title="Identité" icon={HeartHandshake}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nom *"><input name="last_name" required className={input} /></Field>
              <Field label="Post-nom"><input name="middle_name" className={input} /></Field>
              <Field label="Prénom *"><input name="first_name" required className={input} /></Field>
              <Field label="Date de réception *"><input type="date" name="reception_date" required defaultValue={new Date().toISOString().slice(0, 10)} className={input} /></Field>
              <Field label="Culte *"><select name="service_type" required defaultValue="dimanche" className={input}><option value="dimanche">Dimanche</option><option value="semaine">Semaine</option></select></Field>
              <Field label="Sexe *"><select name="gender" required defaultValue="homme" className={input}><option value="homme">Homme</option><option value="femme">Femme</option></select></Field>
              <Field label="État civil *"><select name="marital_status" required defaultValue="celibataire" className={input}><option value="marie">Marié(e)</option><option value="celibataire">Célibataire</option><option value="veuf">Veuf</option><option value="veuve">Veuve</option><option value="en_couple">En couple</option></select></Field>
              <Field label="Tranche d’âge *"><select name="age_range" required defaultValue="18_25" className={input}><option value="0_12">0–12 ans</option><option value="13_17">13–17 ans</option><option value="18_25">18–25 ans</option><option value="26_35">26–35 ans</option><option value="36_45">36–45 ans</option><option value="46_60">46–60 ans</option><option value="60_plus">60 ans et +</option></select></Field>
            </div>
          </FormSection>

          <FormSection title="Coordonnées et origine" icon={UserPlus}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Adresse de résidence *"><input name="residence_address" required className={input} /></Field>
              <Field label="Ville *"><input name="city" required className={input} /></Field>
              <Field label="Pays *"><input name="country" required defaultValue="RDC" className={input} /></Field>
              <Field label="Téléphone WhatsApp *"><input name="whatsapp_phone" required placeholder="+243…" className={input} /></Field>
              <Field label="Autre numéro"><input name="other_phone" className={input} /></Field>
              <Field label="Canal d’arrivée *"><select name="arrival_channel" required defaultValue="amis" className={input}><option value="amis">Amis / proches</option><option value="evangelisation">Évangélisation</option><option value="flyers">Flyers</option><option value="reseaux_sociaux">Réseaux sociaux</option><option value="autre">Autre</option></select></Field>
              <Field label="Prie déjà dans une autre église ? *"><select name="attends_other_church" defaultValue="false" className={input}><option value="false">Non</option><option value="true">Oui</option></select></Field>
            </div>
          </FormSection>

          <FormSection title="Type et suivi" icon={HeartHandshake}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-slate-700"><input type="checkbox" name="is_newcomer" /> Nouveau venu</label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-slate-700"><input type="checkbox" name="is_new_convert" /> Nouveau converti</label>
              <Field label="Membre / responsable associé au suivi *" className="md:col-span-2">
                <select name="assigned_profile_id" required defaultValue="" className={input}>
                  <option value="">Sélectionner la personne chargée du suivi</option>
                  {(assignees ?? []).map((item: any) => (
                    <option key={item.id} value={item.id}>{item.full_name || item.role || "Utilisateur"} — {item.role || "rôle"}</option>
                  ))}
                </select>
                <span className="mt-2 block text-xs font-semibold text-slate-500">Une tâche et une alerte interne seront automatiquement créées pour cette personne.</span>
              </Field>
              <Field label="Commentaire" className="md:col-span-2"><textarea name="comment" rows={5} className="w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" /></Field>
            </div>
          </FormSection>

          <div className="flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
            <Link href="/souls" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 text-sm font-black text-[#03357A]">Annuler</Link>
            <button className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#03357A] px-6 text-sm font-black text-white">Enregistrer et créer le suivi</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><Icon className="h-5 w-5" /></div><h2 className="text-lg font-black text-[#03357A]">{title}</h2></div>{children}</section>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-sm font-black text-[#03357A]">{label}</span>{children}</label>;
}
