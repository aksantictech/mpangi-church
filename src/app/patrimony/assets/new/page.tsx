import Link from "next/link";
import { ArrowLeft, FileUp, PackageCheck, Paperclip } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createPatrimonyAssetAction } from "../../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type NewAssetPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewPatrimonyAssetPage({
  searchParams,
}: NewAssetPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("assets");

  const [{ data: departments }, { data: users }] = await Promise.all([
    admin.from("departments").select("id, name").eq("church_id", profile.church_id).order("name", { ascending: true }),
    admin.from("profiles").select("id, full_name, role").eq("church_id", profile.church_id).eq("status", "active").order("full_name", { ascending: true }),
  ]);

  const errorMessage =
    params.error === "upload"
      ? "Le document n’a pas pu être chargé."
      : params.error
        ? "Impossible d’enregistrer le bien. Vérifiez le nom."
        : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/patrimony/assets" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour aux biens
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <PackageCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Nouveau bien</p>
              <h1 className="mt-3 text-3xl font-extrabold">Ajouter un bien au patrimoine</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Enregistrez le bien, son état, sa valeur, son affectation et les justificatifs.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorMessage}</div>
        )}

        <form action={createPatrimonyAssetAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Identification du bien</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Nom du bien" className="md:col-span-2">
                <input name="name" required placeholder="Ex : Table de mixage, véhicule, chaise..." className={inputClass} />
              </Field>

              <Field label="Code interne">
                <input name="asset_code" placeholder="Automatique si vide" className={inputClass} />
              </Field>

              <Field label="Catégorie">
                <select name="category" defaultValue="other" className={inputClass}>
                  <option value="building">Bâtiment</option>
                  <option value="land">Terrain</option>
                  <option value="vehicle">Véhicule</option>
                  <option value="sound">Sonorisation</option>
                  <option value="it">Informatique</option>
                  <option value="furniture">Mobilier</option>
                  <option value="instrument">Instrument</option>
                  <option value="office">Bureau</option>
                  <option value="security">Sécurité</option>
                  <option value="other">Autre</option>
                </select>
              </Field>

              <Field label="Marque">
                <input name="brand" className={inputClass} />
              </Field>

              <Field label="Modèle">
                <input name="model" className={inputClass} />
              </Field>

              <Field label="Numéro de série">
                <input name="serial_number" className={inputClass} />
              </Field>

              <Field label="Référence achat">
                <input name="purchase_reference" className={inputClass} />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea name="description" rows={4} className={textareaClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Valeur et état</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Quantité">
                <input name="quantity" type="number" min="1" defaultValue="1" className={inputClass} />
              </Field>

              <Field label="Unité">
                <input name="unit" defaultValue="pièce" className={inputClass} />
              </Field>

              <Field label="Date d’acquisition">
                <input type="date" name="acquisition_date" className={inputClass} />
              </Field>

              <Field label="Devise">
                <select name="currency" defaultValue="CDF" className={inputClass}>
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Valeur d’achat">
                <input name="acquisition_value" type="number" step="0.01" min="0" className={inputClass} />
              </Field>

              <Field label="Valeur actuelle estimée">
                <input name="current_value" type="number" step="0.01" min="0" className={inputClass} />
              </Field>

              <Field label="État">
                <select name="condition" defaultValue="good" className={inputClass}>
                  <option value="new">Neuf</option>
                  <option value="good">Bon</option>
                  <option value="average">Moyen</option>
                  <option value="damaged">Endommagé</option>
                  <option value="out_of_service">Hors service</option>
                </select>
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="available" className={inputClass}>
                  <option value="available">Disponible</option>
                  <option value="assigned">Affecté</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="lost">Perdu</option>
                  <option value="sold">Vendu / sorti</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Affectation</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Localisation">
                <input name="location" placeholder="Salle, bureau, adresse..." className={inputClass} />
              </Field>

              <Field label="Département">
                <select name="department_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Responsable">
                <select name="responsible_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun responsable</option>
                  {(users ?? []).map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.role || "Utilisateur"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">Document / justificatif</h2>
                <p className="text-sm text-slate-500">Facture, photo, contrat, certificat ou document lié au bien.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <Field label="Lien document externe">
                <input name="document_url" placeholder="Lien Drive, facture, photo..." className={inputClass} />
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
            <Link href="/patrimony/assets" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Annuler</Link>
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
