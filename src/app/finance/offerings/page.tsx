import Link from "next/link";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { archiveFinanceTransactionAction } from "../actions";

type FinanceListPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

const CONFIG = {
  type: "income",
  moduleCode: "offerings",
  title: "Offrandes, dîmes et entrées",
  subtitle: "Enregistrez et suivez toutes les entrées financières de l’église.",
  newHref: "/finance/offerings/new",
  baseHref: "/finance/offerings",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  recorded: "Enregistré",
  pending_approval: "À valider",
  approved: "Validé",
  rejected: "Rejeté",
  cancelled: "Annulé",
  archived: "Archivé",
};

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

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

function getStatusClass(status: string) {
  if (status === "approved") return "bg-green-50 text-green-700";
  if (status === "pending_approval") return "bg-orange-50 text-orange-700";
  if (status === "archived" || status === "cancelled" || status === "rejected") return "bg-slate-100 text-slate-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function buildCurrentUrl(params: {
  q: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  const value = query.toString();
  return value ? `${CONFIG.baseHref}?${value}` : CONFIG.baseHref;
}

export default async function FinanceTransactionsListPage({
  searchParams,
}: FinanceListPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const status = params.status || "";
  const category = params.category || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const currentUrl = buildCurrentUrl({ q, status, category, dateFrom, dateTo });

  const { admin, profile } = await requireChurchModuleAccess(CONFIG.moduleCode);

  const { data: categories } = await admin
    .from("finance_categories")
    .select("id, name")
    .eq("church_id", profile.church_id)
    .eq("type", CONFIG.type)
    .eq("active", true)
    .order("name", { ascending: true });

  let query = admin
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
      payment_method,
      reference,
      payer_name,
      payee_name,
      status,
      document_path,
      document_name,
      category:finance_categories(name),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("transaction_type", CONFIG.type)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category_id", category);
  if (dateFrom) query = query.gte("transaction_date", dateFrom);
  if (dateTo) query = query.lte("transaction_date", dateTo);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,reference.ilike.%${q}%`);

  const { data: transactions } = await query;
  const rows = transactions ?? [];

  const totalAmount = rows
    .filter((row: any) => row.status !== "archived" && row.status !== "cancelled")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const approvedAmount = rows
    .filter((row: any) => row.status === "approved")
    .reduce((sum: number, row: any) => sum + Number(row.amount_cdf ?? row.amount ?? 0), 0);

  const pendingCount = rows.filter((row: any) => row.status === "pending_approval").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet finances
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">{CONFIG.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                {CONFIG.subtitle}
              </p>
            </div>

            <Link
              href={CONFIG.newHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-4 w-4" />
              Nouveau
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Montant total" value={money(totalAmount)} />
          <Metric label="Validé" value={money(approvedAmount)} />
          <Metric label="À valider" value={String(pendingCount)} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_180px_220px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher titre, référence..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              <option value="draft">Brouillon</option>
              <option value="recorded">Enregistré</option>
              <option value="pending_approval">À valider</option>
              <option value="approved">Validé</option>
              <option value="rejected">Rejeté</option>
              <option value="cancelled">Annulé</option>
              <option value="archived">Archivé</option>
            </select>

            <select name="category" defaultValue={category} className="filter-input">
              <option value="">Toutes catégories</option>
              {(categories ?? []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Filtrer
              </button>
              <Link href={CONFIG.baseHref} className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Mouvements enregistrés
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} mouvement(s) affiché(s).
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucun mouvement trouvé.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.3fr_0.75fr_0.65fr_0.95fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[#03357A]">{row.title}</p>
                      {row.document_path && (
                        <span className="rounded-full bg-[#EAF3FA] px-2 py-0.5 text-xs font-extrabold text-[#03357A]">
                          Justificatif
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {row.category?.name || "Sans catégorie"} · {row.reference || "Sans référence"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`${CONFIG.baseHref}/${row.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]">
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>

                      {row.document_path && (
                        <a href={getDocumentDownloadHref({ path: row.document_path, filename: row.document_name || row.title })} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-[#DCEAF5]">
                          <Download className="h-4 w-4" />
                          Fichier
                        </a>
                      )}

                      {row.status !== "archived" && (
                        <form action={archiveFinanceTransactionAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="transaction_type" value={CONFIG.type} />
                          <input type="hidden" name="redirectTo" value={currentUrl} />
                          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                            <Archive className="h-4 w-4" />
                            Archiver
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Montant</p>
                    <p className="mt-1 text-lg font-black text-slate-800">{money(Number(row.amount || 0), row.currency || "CDF")}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Date : {formatDate(row.transaction_date)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{row.payment_method}</p>
                  </div>

                  <div className="rounded-2xl bg-[#F8FBFD] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Personne / service</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {CONFIG.type === "income"
                        ? row.payer_name || "-"
                        : row.payee_name || "-"} · {row.department?.name || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#03357A]">{value}</p>
    </div>
  );
}
