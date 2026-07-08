import Link from "next/link";
import { ArrowLeft, FileUp, Paperclip, Wrench } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createAssetMaintenanceAction } from "../../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type NewMaintenancePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAssetMaintenancePage({
  searchParams,
}: NewMaintenancePageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("asset_maintenance");

  const { data: assets } = await admin
    .from("patrimony_assets")
    .select("id, name, asset_code, status")
    .eq("church_id", profile.church_id)
    .neq("status", "archived")
    .order("name", { ascending: true });

  const errorMessage =
    params.error === "upload"
      ? "Le document n’a pas pu être chargé."
      : params.error
        ? "Impossible d’enregistrer la maintenance. Vérifiez le bien et le titre."
        : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/patrimony/maintenance" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour aux maintenances
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Wrench className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Nouvelle maintenance</p>
              <h1 className="mt-3 text-3xl font-extrabold">Programmer une maintenance</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Enregistrez une réparation, inspection ou maintenance préventive.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>}

        <form action={createAssetMaintenanceAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Informations maintenance</h2>

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

              <Field label="Titre" className="md:col-span-2">
                <input name="title" required placeholder="Ex : Réparation micro, entretien véhicule..." className={inputClass} />
              </Field>

              <Field label="Type">
                <select name="maintenance_type" defaultValue="corrective" className={inputClass}>
                  <option value="preventive">Préventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="inspection">Inspection</option>
                  <option value="repair">Réparation</option>
                  <option value="other">Autre</option>
                </select>
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="planned" className={inputClass}>
                  <option value="planned">Planifiée</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="archived">Archivée</option>
                </select>
              </Field>

              <Field label="Prestataire">
                <input name="provider_name" placeholder="Nom du technicien/fournisseur" className={inputClass} />
              </Field>

              <Field label="Coût">
                <input name="cost" type="number" step="0.01" min="0" className={inputClass} />
              </Field>

              <Field label="Devise">
                <select name="currency" defaultValue="CDF" className={inputClass}>
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Date prévue">
                <input type="date" name="planned_date" className={inputClass} />
              </Field>

              <Field label="Date terminée">
                <input type="date" name="completed_date" className={inputClass} />
              </Field>

              <Field label="Prochaine échéance">
                <input type="date" name="next_due_date" className={inputClass} />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea name="description" rows={5} placeholder="Détails de l’intervention..." className={textareaClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">Document</h2>
                <p className="text-sm text-slate-500">Facture, devis, photo ou rapport technique.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <Field label="Lien document externe">
                <input name="document_url" placeholder="Lien Drive, facture, devis..." className={inputClass} />
              </Field>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DCEAF5] bg-[#F8FBFD] px-5 py-8 text-center transition hover:border-[#03357A]/40 hover:bg-[#EAF3FA]">
                <FileUp className="h-10 w-10 text-[#03357A]" />
                <span className="mt-3 text-sm font-extrabold text-[#03357A]">Uploader un document</span>
                <span className="mt-1 text-xs font-semibold text-slate-500">PDF, image, Word ou Excel.</span>
                <input type="file" name="document_file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" className="mt-4 w-full max-w-md rounded-2xl bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#03357A] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href="/patrimony/maintenance" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Annuler</Link>
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
