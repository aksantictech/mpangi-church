import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Wallet,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateFinanceTransactionStatusAction } from "../../actions";

type FinanceTransactionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const CONFIG = {
  type: "income",
  moduleCode: "offerings",
  backHref: "/finance/offerings",
  title: "Entrée financière",
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

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank_transfer: "Virement bancaire",
  card: "Carte",
  cheque: "Chèque",
  other: "Autre",
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

function formatSize(value?: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function FinanceTransactionDetailPage({
  params,
}: FinanceTransactionDetailPageProps) {
  const { id } = await params;
  const { admin, profile } = await requireChurchModuleAccess(CONFIG.moduleCode);

  const { data: transaction } = await admin
    .from("finance_transactions")
    .select(
      `
      *,
      category:finance_categories(name),
      department:departments(name),
      created_profile:profiles!finance_transactions_created_by_fkey(full_name, role),
      approved_profile:profiles!finance_transactions_approved_by_fkey(full_name, role)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("transaction_type", CONFIG.type)
    .eq("id", id)
    .maybeSingle();

  if (!transaction) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href={CONFIG.backHref} className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                {CONFIG.title}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">{transaction.title}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                Date : {formatDate(transaction.transaction_date)} · Catégorie : {transaction.category?.name || "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-2xl font-black">
                {money(Number(transaction.amount || 0), transaction.currency || "CDF")}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Montant
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Statut" value={STATUS_LABELS[transaction.status] || transaction.status} icon={Wallet} />
          <InfoCard label="Mode paiement" value={PAYMENT_LABELS[transaction.payment_method] || transaction.payment_method} icon={Wallet} />
          <InfoCard label="Département" value={transaction.department?.name || "-"} icon={FileText} />
          <InfoCard label="Référence" value={transaction.reference || "-"} icon={CalendarDays} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Détails du mouvement
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Detail label="Montant" value={money(Number(transaction.amount || 0), transaction.currency || "CDF")} />
              <Detail label="Montant CDF" value={transaction.amount_cdf ? money(Number(transaction.amount_cdf), "CDF") : "-"} />
              <Detail label="Taux" value={transaction.exchange_rate ? String(transaction.exchange_rate) : "-"} />
              <Detail label={CONFIG.type === "income" ? "Donateur / contributeur" : "Bénéficiaire / fournisseur"} value={CONFIG.type === "income" ? transaction.payer_name : transaction.payee_name} />
              <Detail label="Créé par" value={transaction.created_profile?.full_name || "-"} />
              <Detail label="Validé par" value={transaction.approved_profile?.full_name || "-"} />
            </div>

            <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {transaction.description || "Aucune description."}
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
              <h3 className="font-extrabold text-[#03357A]">Justificatif</h3>

              {transaction.document_path ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">{transaction.document_name || "Document"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.document_mime_type || "Fichier"} · {formatSize(transaction.document_size)}
                    </p>
                  </div>

                  <a href={getDocumentDownloadHref({ path: transaction.document_path, filename: transaction.document_name || transaction.title })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Aucun fichier chargé.</p>
              )}

              {transaction.document_url && (
                <a href={transaction.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le lien externe
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Mise à jour du statut</h2>
            <p className="mt-1 text-sm text-slate-500">Validez, rejetez ou archivez le mouvement.</p>

            <form action={updateFinanceTransactionStatusAction} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={transaction.id} />
              <input type="hidden" name="transaction_type" value={CONFIG.type} />

              <select name="status" defaultValue={transaction.status} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10">
                <option value="draft">Brouillon</option>
                <option value="recorded">Enregistré</option>
                <option value="pending_approval">À valider</option>
                <option value="approved">Validé</option>
                <option value="rejected">Rejeté</option>
                <option value="cancelled">Annulé</option>
                <option value="archived">Archivé</option>
              </select>

              <button type="submit" className="w-full rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Mettre à jour
              </button>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#03357A]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-extrabold text-[#03357A]">{value}</p>
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
