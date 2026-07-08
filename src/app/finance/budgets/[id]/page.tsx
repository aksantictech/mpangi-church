import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  PieChart,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type BudgetDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  closed: "Clôturé",
  archived: "Archivé",
};

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default async function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  const { id } = await params;
  const { admin, profile } = await requireChurchModuleAccess("budgets");

  const { data: budget } = await admin
    .from("finance_budgets")
    .select(
      `
      *,
      category:finance_categories(name),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .maybeSingle();

  if (!budget) notFound();

  let expensesQuery = admin
    .from("finance_transactions")
    .select("id, title, amount, currency, amount_cdf, transaction_date, status")
    .eq("church_id", profile.church_id)
    .eq("transaction_type", "expense")
    .neq("status", "archived")
    .gte("transaction_date", budget.period_start)
    .lte("transaction_date", budget.period_end)
    .order("transaction_date", { ascending: false })
    .limit(100);

  if (budget.category_id) expensesQuery = expensesQuery.eq("category_id", budget.category_id);
  if (budget.department_id) expensesQuery = expensesQuery.eq("department_id", budget.department_id);

  const { data: expenses } = await expensesQuery;
  const expenseRows = expenses ?? [];
  const spent = expenseRows.reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);
  const remaining = Number(budget.amount || 0) - spent;
  const rate = Number(budget.amount || 0) > 0 ? Math.min(100, Math.round((spent / Number(budget.amount || 0)) * 100)) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/finance/budgets" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
            <ArrowLeft className="h-4 w-4" />
            Retour aux budgets
          </Link>

          <Link href={`/finance/budgets/${budget.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Budget</p>
              <h1 className="mt-3 text-3xl font-extrabold">{budget.title}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                {formatDate(budget.period_start)} - {formatDate(budget.period_end)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-2xl font-black">{money(Number(budget.amount || 0), budget.currency || "CDF")}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Montant prévu</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Prévu" value={money(Number(budget.amount || 0), budget.currency || "CDF")} icon={PieChart} />
          <Metric label="Dépensé" value={money(spent, "CDF")} icon={PieChart} />
          <Metric label="Reste" value={money(remaining, "CDF")} icon={PieChart} />
          <Metric label="Consommation" value={`${rate}%`} icon={PieChart} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">Progression</h2>
          <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#EAF3FA]">
            <div className="h-full rounded-full bg-[#03357A]" style={{ width: `${rate}%` }} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Detail label="Catégorie" value={budget.category?.name || "-"} />
            <Detail label="Département" value={budget.department?.name || "-"} />
            <Detail label="Statut" value={STATUS_LABELS[budget.status] || budget.status} />
            <Detail label="Devise" value={budget.currency || "CDF"} />
          </div>

          <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{budget.notes || "-"}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">Dépenses liées à ce budget</h2>
          <div className="mt-5 divide-y divide-[#DCEAF5]">
            {expenseRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Aucune dépense liée trouvée.</p>
            ) : (
              expenseRows.map((row: any) => (
                <div key={row.id} className="grid gap-3 py-4 md:grid-cols-[1fr_180px_140px] md:items-center">
                  <div>
                    <p className="font-extrabold text-[#03357A]">{row.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(row.transaction_date)} · {row.status}</p>
                  </div>
                  <p className="font-black text-slate-800">{money(Number(row.amount || 0), row.currency || "CDF")}</p>
                  <Link href={`/finance/expenses/${row.id}`} className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-2 text-xs font-extrabold text-[#03357A]">Voir</Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#03357A]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[#03357A]">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{value || "-"}</p>
    </div>
  );
}
