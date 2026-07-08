import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createAssetMovementAction } from "../../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type NewMovementPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAssetMovementPage({
  searchParams,
}: NewMovementPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("asset_movements");

  const [{ data: assets }, { data: departments }, { data: users }] = await Promise.all([
    admin.from("patrimony_assets").select("id, name, asset_code, location").eq("church_id", profile.church_id).neq("status", "archived").order("name", { ascending: true }),
    admin.from("departments").select("id, name").eq("church_id", profile.church_id).order("name", { ascending: true }),
    admin.from("profiles").select("id, full_name, role").eq("church_id", profile.church_id).eq("status", "active").order("full_name", { ascending: true }),
  ]);

  const errorMessage = params.error
    ? "Impossible d’enregistrer le mouvement. Vérifiez le bien concerné."
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/patrimony/movements" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour aux mouvements
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <ArrowLeftRight className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Nouveau mouvement</p>
              <h1 className="mt-3 text-3xl font-extrabold">Enregistrer un mouvement de bien</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Affectation, transfert, retour, perte, vente ou ajustement d’inventaire.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>}

        <form action={createAssetMovementAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Informations du mouvement</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Bien concerné" className="md:col-span-2">
                <select name="asset_id" required defaultValue="" className={inputClass}>
                  <option value="">Sélectionner un bien</option>
                  {(assets ?? []).map((asset: any) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} {asset.asset_code ? `— ${asset.asset_code}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type de mouvement">
                <select name="movement_type" defaultValue="assignment" className={inputClass}>
                  <option value="assignment">Affectation</option>
                  <option value="transfer">Transfert</option>
                  <option value="return">Retour</option>
                  <option value="loan">Prêt</option>
                  <option value="loss">Perte</option>
                  <option value="sale">Vente</option>
                  <option value="disposal">Sortie définitive</option>
                  <option value="inventory_adjustment">Ajustement inventaire</option>
                </select>
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="completed" className={inputClass}>
                  <option value="draft">Brouillon</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>

              <Field label="Date">
                <input type="date" name="movement_date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </Field>

              <Field label="Quantité">
                <input type="number" name="quantity" min="1" defaultValue="1" className={inputClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Origine et destination</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Localisation de départ">
                <input name="from_location" placeholder="Ancienne localisation" className={inputClass} />
              </Field>

              <Field label="Nouvelle localisation">
                <input name="to_location" placeholder="Nouvelle localisation" className={inputClass} />
              </Field>

              <Field label="Département de départ">
                <select name="from_department_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nouveau département">
                <select name="to_department_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ancien responsable">
                <select name="from_responsible_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun responsable</option>
                  {(users ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.role || "Utilisateur"}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nouveau responsable">
                <select name="to_responsible_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun responsable</option>
                  {(users ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.role || "Utilisateur"}</option>
                  ))}
                </select>
              </Field>

              <Field label="Motif / observation" className="md:col-span-2">
                <textarea name="reason" rows={5} placeholder="Pourquoi ce mouvement ?" className={textareaClass} />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href="/patrimony/movements" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Annuler</Link>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">Enregistrer</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-sm font-extrabold text-[#03357A]">{label}</span>
      {children}
    </label>
  );
}
