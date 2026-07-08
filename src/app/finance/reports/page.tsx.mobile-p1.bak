import Link from "next/link";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  PieChart,
  Printer,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type FinancialReportsPageProps = {
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    department?: string;
  }>;
};

function monthStart() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

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
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function exportUrl(params: {
  dateFrom: string;
  dateTo: string;
  category: string;
  department: string;
}) {
  const query = new URLSearchParams();
  query.set("dateFrom", params.dateFrom);
  query.set("dateTo", params.dateTo);
  if (params.category) query.set("category", params.category);
  if (params.department) query.set("department", params.department);
  return `/api/finance/reports/export?${query.toString()}`;
}

export default async function FinancialReportsPage({
  searchParams,
}: FinancialReportsPageProps) {
  const params = searchParams ? await searchParams : {};
  const dateFrom = params.dateFrom || monthStart();
  const dateTo = params.dateTo || today();
  const category = params.category || "";
  const department = params.department || "";

  const { admin, profile } = await requireChurchModuleAccess("financial_reports");

  const [{ data: categories }, { data: departments }] = await Promise.all([
    admin
      .from("finance_categories")
      .select("id, name, type")
      .eq("church_id", profile.church_id)
      .eq("active", true)
      .order("type", { ascending: true })
      .order("name", { ascending: true }),

    admin
      .from("departments")
      .select("id, name")
      .eq("church_id", profile.church_id)
      .order("name", { ascending: true }),
  ]);

  let txQuery = admin
    .from("finance_transactions")
    .select(
      `
      id,
      transaction_type,
      title,
      amount,
      currency,
      amount_cdf,
      transaction_date,
      status,
      category_id,
      department_id,
      category:finance_categories(name, type),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .gte("transaction_date", dateFrom)
    .lte("transaction_date", dateTo)
    .neq("status", "archived")
    .order("transaction_date", { ascending: false })
    .limit(1000);

  if (category) txQuery = txQuery.eq("category_id", category);
  if (department) txQuery = txQuery.eq("department_id", department);

  const { data: transactions } = await txQuery;
  const rows = transactions ?? [];

  let budgetQuery = admin
    .from("finance_budgets")
    .select(
      `
      id,
      title,
      amount,
      currency,
      period_start,
      period_end,
      status,
      category_id,
      department_id,
      category:finance_categories(name),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .neq("status", "archived")
    .lte("period_start", dateTo)
    .gte("period_end", dateFrom)
    .order("period_start", { ascending: false })
    .limit(300);

  if (category) budgetQuery = budgetQuery.eq("category_id", category);
  if (department) budgetQuery = budgetQuery.eq("department_id", department);

  const { data: budgets } = await budgetQuery;
  const budgetRows = budgets ?? [];

  const income = rows
    .filter((row: any) => row.transaction_type === "income")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const expenses = rows
    .filter((row: any) => row.transaction_type === "expense")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const balance = income - expenses;

  const totalBudgets = budgetRows.reduce(
    (sum: number, row: any) => sum + Number(row.amount || 0),
    0
  );

  const byCategory = new Map<string, { income: number; expenses: number }>();

  for (const row of rows as any[]) {
    const name = row.category?.name || "Sans catégorie";
    const current = byCategory.get(name) || { income: 0, expenses: 0 };
    if (row.transaction_type === "income") {
      current.income += Number(row.amount_cdf ?? row.amount ?? 0);
    } else {
      current.expenses += Number(row.amount_cdf ?? row.amount ?? 0);
    }
    byCategory.set(name, current);
  }

  const categoryRows = Array.from(byCategory.entries()).map(([name, values]) => ({
    name,
    ...values,
    balance: values.income - values.expenses,
  }));

  return (
    <AppShell>
      <div className="space-y-6 print:bg-white">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20 print:bg-white print:text-black print:shadow-none">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100 print:text-slate-600">
                Volet finances
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">Rapports financiers</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50 print:text-slate-600">
                Synthèse des entrées, dépenses, soldes, budgets et catégories sur une période.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row print:hidden">
              <a href={exportUrl({ dateFrom, dateTo, category, department })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
                <Download className="h-4 w-4" />
                Export Excel CSV
              </a>

              <button type="button" onClick={undefined} className="hidden" />
              <a href="javascript:window.print()" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/30 hover:bg-white/20">
                <Printer className="h-4 w-4" />
                Imprimer / PDF
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm print:hidden">
          <form className="grid gap-3 xl:grid-cols-[180px_180px_240px_240px_auto]">
            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <select name="category" defaultValue={category} className="filter-input">
              <option value="">Toutes catégories</option>
              {(categories ?? []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.type === "income" ? "Entrée" : "Dépense"} — {item.name}
                </option>
              ))}
            </select>

            <select name="department" defaultValue={department} className="filter-input">
              <option value="">Tous départements</option>
              {(departments ?? []).map((item: any) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Filtrer
              </button>
              <Link href="/finance/reports" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
                Mois actuel
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Entrées" value={money(income)} icon={BarChart3} />
          <Metric label="Dépenses" value={money(expenses)} icon={BarChart3} />
          <Metric label="Solde" value={money(balance)} icon={BarChart3} />
          <Metric label="Budgets" value={money(totalBudgets)} icon={PieChart} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-[#03357A]" />
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Rapport par catégorie
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Période : {dateFrom} au {dateTo}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCEAF5] text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-4">Catégorie</th>
                  <th className="py-3 pr-4">Entrées</th>
                  <th className="py-3 pr-4">Dépenses</th>
                  <th className="py-3 pr-4">Solde</th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Aucune donnée.
                    </td>
                  </tr>
                ) : (
                  categoryRows.map((row) => (
                    <tr key={row.name} className="border-b border-[#DCEAF5]">
                      <td className="py-3 pr-4 font-bold text-[#03357A]">{row.name}</td>
                      <td className="py-3 pr-4 font-semibold">{money(row.income)}</td>
                      <td className="py-3 pr-4 font-semibold">{money(row.expenses)}</td>
                      <td className="py-3 pr-4 font-black">{money(row.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Derniers mouvements</h2>
            <div className="mt-5 divide-y divide-[#DCEAF5]">
              {rows.slice(0, 10).map((row: any) => (
                <div key={row.id} className="py-3">
                  <p className="font-extrabold text-[#03357A]">{row.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(row.transaction_date)} · {row.category?.name || "-"} · {row.transaction_type === "income" ? "Entrée" : "Dépense"}
                  </p>
                  <p className="mt-1 font-black text-slate-800">{money(Number(row.amount || 0), row.currency || "CDF")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Budgets de la période</h2>
            <div className="mt-5 divide-y divide-[#DCEAF5]">
              {budgetRows.slice(0, 10).map((row: any) => (
                <div key={row.id} className="py-3">
                  <p className="font-extrabold text-[#03357A]">{row.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(row.period_start)} - {formatDate(row.period_end)} · {row.category?.name || "-"}
                  </p>
                  <p className="mt-1 font-black text-slate-800">{money(Number(row.amount || 0), row.currency || "CDF")}</p>
                </div>
              ))}
            </div>
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
