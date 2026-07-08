import Link from "next/link";
import { ArrowLeft, FileUp, Paperclip, Plus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createFinanceTransactionAction } from "../../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const CONFIG = {
  type: "income",
  moduleCode: "offerings",
  title: "Nouvelle entrée financière",
  backHref: "/finance/offerings",
  personLabel: "Donateur / contributeur",
  personName: "payer_name",
};

type NewFinanceTransactionPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewFinanceTransactionPage({
  searchParams,
}: NewFinanceTransactionPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess(CONFIG.moduleCode);

  const [{ data: categories }, { data: departments }, { data: tasks }] =
    await Promise.all([
      admin
        .from("finance_categories")
        .select("id, name")
        .eq("church_id", profile.church_id)
        .eq("type", CONFIG.type)
        .eq("active", true)
        .order("name", { ascending: true }),

      admin
        .from("departments")
        .select("id, name")
        .eq("church_id", profile.church_id)
        .order("name", { ascending: true }),

      admin
        .from("admin_tasks")
        .select("id, title, status")
        .eq("church_id", profile.church_id)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

  const errorMessage =
    params.error === "upload"
      ? "Le justificatif n’a pas pu être chargé."
      : params.error
        ? "Impossible d’enregistrer le mouvement. Vérifiez le titre et le montant."
        : "";

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <Link href={CONFIG.backHref} className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 sm:p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Plus className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet finances
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold">{CONFIG.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Enregistrez le montant, la catégorie, le mode de paiement et le justificatif.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createFinanceTransactionAction} className="space-y-5">
          <input type="hidden" name="transaction_type" value={CONFIG.type} />

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Informations principales</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Titre" className="md:col-span-2">
                <input name="title" required placeholder="Ex : Offrande culte dimanche / Achat matériel..." className={inputClass} />
              </Field>

              <Field label="Catégorie">
                <select name="category_id" defaultValue="" className={inputClass}>
                  <option value="">Sans catégorie</option>
                  {(categories ?? []).map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="recorded" className={inputClass}>
                  <option value="draft">Brouillon</option>
                  <option value="recorded">Enregistré</option>
                  <option value="pending_approval">À valider</option>
                  <option value="approved">Validé</option>
                  <option value="rejected">Rejeté</option>
                  <option value="cancelled">Annulé</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>

              <Field label="Montant">
                <input name="amount" type="number" step="0.01" min="0" required placeholder="0" className={inputClass} />
              </Field>

              <Field label="Devise">
                <select name="currency" defaultValue="CDF" className={inputClass}>
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Taux vers CDF">
                <input name="exchange_rate" type="number" step="0.0001" min="0" placeholder="Optionnel si USD/EUR" className={inputClass} />
              </Field>

              <Field label="Date">
                <input type="date" name="transaction_date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              </Field>

              <Field label="Mode de paiement">
                <select name="payment_method" defaultValue="cash" className={inputClass}>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile money</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="card">Carte</option>
                  <option value="cheque">Chèque</option>
                  <option value="other">Autre</option>
                </select>
              </Field>

              <Field label="Référence">
                <input name="reference" placeholder="Référence reçu, transaction, bordereau..." className={inputClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Affectation</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={CONFIG.personLabel}>
                <input name={CONFIG.personName} placeholder={CONFIG.personLabel} className={inputClass} />
              </Field>

              <Field label="Département">
                <select name="department_id" defaultValue="" className={inputClass}>
                  <option value="">Aucun département</option>
                  {(departments ?? []).map((department: any) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tâche administrative liée" className="md:col-span-2">
                <select name="related_task_id" defaultValue="" className={inputClass}>
                  <option value="">Aucune tâche liée</option>
                  {(tasks ?? []).map((task: any) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea name="description" rows={5} placeholder="Observations, contexte, notes..." className={textareaClass} />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">Justificatif</h2>
                <p className="text-sm text-slate-500">Ajoutez un fichier ou un lien externe.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <Field label="Lien document externe">
                <input name="document_url" placeholder="Lien Drive, reçu scanné, facture..." className={inputClass} />
              </Field>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#DCEAF5] bg-[#F8FBFD] px-5 py-8 text-center transition hover:border-[#03357A]/40 hover:bg-[#EAF3FA]">
                <FileUp className="h-10 w-10 text-[#03357A]" />
                <span className="mt-3 text-sm font-extrabold text-[#03357A]">Uploader un justificatif</span>
                <span className="mt-1 text-xs font-semibold text-slate-500">PDF, image, Word ou Excel.</span>
                <input type="file" name="document_file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" className="mt-4 w-full max-w-md rounded-2xl bg-white p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#03357A] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href={CONFIG.backHref} className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-3 sm:px-5 text-sm font-extrabold text-[#03357A]">
              Annuler
            </Link>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-4 py-3 sm:px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-sm font-extrabold text-[#03357A]">{label}</span>
      {children}
    </label>
  );
}
