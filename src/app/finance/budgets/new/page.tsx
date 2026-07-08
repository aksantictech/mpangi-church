import Link from "next/link";
import { ArrowLeft, PieChart } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createFinanceBudgetAction } from "../actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";
const textareaClass = "w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

type NewBudgetPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewFinanceBudgetPage({
  searchParams,
}: NewBudgetPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("budgets");

  const [{ data: categories }, { data: departments }] = await Promise.all([
    admin
      .from("finance_categories")
      .select("id, name")
      .eq("church_id", profile.church_id)
      .eq("type", "expense")
      .eq("active", true)
      .order("name", { ascending: true }),

    admin
      .from("departments")
      .select("id, name")
      .eq("church_id", profile.church_id)
      .order("name", { ascending: true }),
  ]);

  const errorMessage = params.error
    ? "Impossible d’enregistrer le budget. Vérifiez le titre, la période et le montant."
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/finance/budgets" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour aux budgets
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <PieChart className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet finances
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">Nouveau budget</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Créez un budget par période, catégorie et département.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <form action={createFinanceBudgetAction} className="space-y-5">
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#03357A]">Informations budget</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Titre du budget" className="md:col-span-2">
                <input name="title" required placeholder="Ex : Budget communication juillet..." className={inputClass} />
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

              <Field label="Montant prévu">
                <input name="amount" type="number" step="0.01" min="0" required placeholder="0" className={inputClass} />
              </Field>

              <Field label="Devise">
                <select name="currency" defaultValue="CDF" className={inputClass}>
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field label="Début période">
                <input type="date" name="period_start" required className={inputClass} />
              </Field>

              <Field label="Fin période">
                <input type="date" name="period_end" required className={inputClass} />
              </Field>

              <Field label="Statut">
                <select name="status" defaultValue="active" className={inputClass}>
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="closed">Clôturé</option>
                  <option value="archived">Archivé</option>
                </select>
              </Field>

              <Field label="Notes" className="md:col-span-2">
                <textarea name="notes" rows={5} placeholder="Observations, justification, périmètre..." className={textareaClass} />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white/95 p-4 shadow-lg backdrop-blur md:flex-row md:justify-end">
            <Link href="/finance/budgets" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
              Annuler
            </Link>
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20">
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
