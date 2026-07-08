import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type FinanceDashboardPageProps = {
  searchParams?: Promise<{
    dateFrom?: string;
    dateTo?: string;
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

export default async function FinanceDashboardPage({
  searchParams,
}: FinanceDashboardPageProps) {
  const params = searchParams ? await searchParams : {};
  const dateFrom = params.dateFrom || monthStart();
  const dateTo = params.dateTo || today();

  const { admin, profile } = await requireChurchModuleAccess("finance_dashboard");

  const { data: transactions } = await admin
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
      category:finance_categories(name)
      `
    )
    .eq("church_id", profile.church_id)
    .gte("transaction_date", dateFrom)
    .lte("transaction_date", dateTo)
    .neq("status", "archived")
    .order("transaction_date", { ascending: false })
    .limit(300);

  const rows = transactions ?? [];

  const incomeCdf = rows
    .filter((row: any) => row.transaction_type === "income")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const expenseCdf = rows
    .filter((row: any) => row.transaction_type === "expense")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const balance = incomeCdf - expenseCdf;
  const pendingCount = rows.filter((row: any) => row.status === "pending_approval").length;
  const recentRows = rows.slice(0, 8);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet finances
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">
                Dashboard finances
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Suivez les entrées, les dépenses, le solde et les mouvements à valider.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/finance/offerings/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
                <Plus className="h-4 w-4" />
                Entrée
              </Link>
              <Link href="/finance/expenses/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/30 hover:bg-white/20">
                <Plus className="h-4 w-4" />
                Dépense
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[220px_220px_auto]">
            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />
            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">Filtrer</button>
              <Link href="/finance" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Mois actuel</Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Entrées" value={money(incomeCdf)} icon={ArrowUpCircle} />
          <Metric label="Dépenses" value={money(expenseCdf)} icon={ArrowDownCircle} />
          <Metric label="Solde période" value={money(balance)} icon={Wallet} />
          <Metric label="À valider" value={String(pendingCount)} icon={ReceiptText} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Mouvements récents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Période : {formatDate(dateFrom)} - {formatDate(dateTo)}
              </p>
            </div>
            <BarChart3 className="h-6 w-6 text-[#03357A]" />
          </div>

          <div className="mt-5 divide-y divide-[#DCEAF5]">
            {recentRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Aucun mouvement financier sur cette période.
              </p>
            ) : (
              recentRows.map((row: any) => (
                <div key={row.id} className="grid gap-3 py-4 md:grid-cols-[1fr_160px_160px_120px] md:items-center">
                  <div>
                    <p className="font-extrabold text-[#03357A]">{row.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.category?.name || "Sans catégorie"} · {formatDate(row.transaction_date)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {row.transaction_type === "income" ? "Entrée" : "Dépense"}
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {money(Number(row.amount || 0), row.currency || "CDF")}
                  </p>
                  <Link
                    href={row.transaction_type === "income" ? `/finance/offerings/${row.id}` : `/finance/expenses/${row.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-2 text-xs font-extrabold text-[#03357A]"
                  >
                    Voir
                  </Link>
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#03357A]">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
