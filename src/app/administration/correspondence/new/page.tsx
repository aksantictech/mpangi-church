import Link from "next/link";
import { ArrowLeft, CalendarDays, FileUp, MailPlus, Paperclip } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createCorrespondenceAction } from "../actions";

type NewCorrespondencePageProps = { searchParams?: Promise<{ error?: string }> };

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function NewCorrespondencePage({ searchParams }: NewCorrespondencePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  const [{ data: departments }, { data: users }] = await Promise.all([
    admin.from("departments").select("id, name").eq("church_id", profile.church_id).order("name", { ascending: true }),
    admin.from("profiles").select("id, full_name, role").eq("church_id", profile.church_id).eq("status", "active").order("full_name", { ascending: true }),
  ]);

  const errorMessage = resolvedSearchParams.error === "upload"
    ? "Le fichier n’a pas pu être chargé. Vérifiez le format ou la taille."
    : resolvedSearchParams.error
      ? "Impossible d’enregistrer le courrier. Vérifiez les champs obligatoires."
      : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/administration/correspondence" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" /> Retour aux courriers
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><MailPlus className="h-7 w-7" /></div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Nouveau courrier</p>
              <h1 className="mt-3 text-3xl font-extrabold">Enregistrer un courrier</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Ajoutez un courrier entrant, sortant ou interne avec document joint, suivi administratif et responsable assigné.</p>
            </div>
          </div>
        </section>

        {errorMessage && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>}

        <form action={createCorrespondenceAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><CalendarDays className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-extrabold text-[#03357A]">Informations principales</h2><p className="text-sm text-slate-500">Type, date, objet, statut et priorité du courrier.</p></div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Type de courrier"><select name="type" defaultValue="incoming" required className={inputClass}><option value="incoming">Courrier entrant</option><option value="outgoing">Courrier sortant</option><option value="internal">Courrier interne</option></select></Field>
              <Field label="Date du courrier"><input type="date" name="correspondence_date" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} /></Field>
              <Field label="Objet du courrier" className="md:col-span-2"><input name="subject" required placeholder="Ex : Invitation officielle, demande administrative..." className={inputClass} /></Field>
              <Field label="Priorité"><select name="priority" defaultValue="normal" className={inputClass}><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></Field>
              <Field label="Statut"><select name="status" defaultValue="received" className={inputClass}><option value="draft">Brouillon</option><option value="received">Reçu</option><option value="sent">Envoyé</option><option value="in_review">En traitement</option><option value="transmitted">Transmis</option><option value="closed">Clôturé</option><option value="archived">Archivé</option></select></Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Expéditeur et destinataire</h2>
            <p className="mt-1 text-sm text-slate-500">Renseignez les personnes ou structures concernées.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Expéditeur"><input name="sender_name" placeholder="Nom de l’expéditeur" className={inputClass} /></Field>
              <Field label="Contact expéditeur"><input name="sender_contact" placeholder="Téléphone, email ou adresse" className={inputClass} /></Field>
              <Field label="Destinataire"><input name="recipient_name" placeholder="Nom du destinataire" className={inputClass} /></Field>
              <Field label="Contact destinataire"><input name="recipient_contact" placeholder="Téléphone, email ou adresse" className={inputClass} /></Field>
              <Field label="Département concerné"><select name="department_id" defaultValue="" className={inputClass}><option value="">Aucun département</option>{(departments ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
              <Field label="Responsable assigné"><select name="assigned_to" defaultValue="" className={inputClass}><option value="">Non assigné</option>{(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.role || "Utilisateur"} {u.role ? `(${u.role})` : ""}</option>)}</select></Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><Paperclip className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-extrabold text-[#03357A]">Document et suivi</h2><p className="text-sm text-slate-500">Joignez un fichier ou indiquez un lien externe.</p></div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Date limite"><input type="date" name="due_date" className={inputClass} /></Field>
              <Field label="Lien document externe"><input name="document_url" placeholder="Lien Drive, OneDrive, site web..." className={inputClass} /></Field>
              <div className="md:col-span-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DCEAF5] bg-[#F8FBFD] px-5 py-8 text-center transition hover:border-[#03357A]/40 hover:bg-[#EAF3FA]">
                  <FileUp className="h-10 w-10 text-[#03357A]" />
                  <span className="mt-3 text-sm font-extrabold text-[#03357A]">Uploader un fichier</span>
                  <span className="mt-1 text-xs font-semibold text-slate-500">PDF, image, Word ou Excel.</span>
                  <input type="file" name="document_file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" className="mt-4 w-full max-w-md rounded-2xl bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#03357A] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 md:col-span-2"><input type="checkbox" name="confidential" className="h-4 w-4 rounded border-slate-300" /><span className="text-sm font-bold text-[#03357A]">Marquer comme confidentiel</span></label>
              <Field label="Notes internes" className="md:col-span-2"><textarea name="notes" rows={5} placeholder="Observations, consignes, contexte..." className={textareaClass} /></Field>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href="/administration/correspondence" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Annuler</Link>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">Enregistrer le courrier</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`space-y-2 ${className}`}><span className="block text-sm font-extrabold text-[#03357A]">{label}</span>{children}</label>;
}
