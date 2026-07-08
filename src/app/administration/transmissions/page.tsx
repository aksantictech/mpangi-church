import Link from "next/link";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Inbox,
  Pencil,
  Search,
  Send,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { archiveTransmissionAction } from "./actions";

type TransmissionsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Envoyé",
  received: "Reçu",
  read: "Lu",
  in_progress: "En traitement",
  completed: "Terminé",
  returned: "Retourné",
  archived: "Archivé",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
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

function getStatusClass(status: string) {
  if (status === "completed" || status === "archived") return "bg-green-50 text-green-700";
  if (status === "returned") return "bg-red-50 text-red-700";
  if (status === "in_progress") return "bg-orange-50 text-orange-700";
  if (status === "read" || status === "received") return "bg-blue-50 text-blue-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-orange-50 text-orange-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function buildCurrentQuery(params: {
  q: string;
  status: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
}) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  const value = query.toString();
  return value ? `/administration/transmissions?${value}` : "/administration/transmissions";
}

export default async function TransmissionsPage({
  searchParams,
}: TransmissionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const q = (resolvedSearchParams.q || "").trim();
  const status = resolvedSearchParams.status || "";
  const priority = resolvedSearchParams.priority || "";
  const dateFrom = resolvedSearchParams.dateFrom || "";
  const dateTo = resolvedSearchParams.dateTo || "";

  const currentUrl = buildCurrentQuery({ q, status, priority, dateFrom, dateTo });

  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");

  let query = admin
    .from("admin_document_transmissions")
    .select(
      `
      id,
      reference,
      title,
      priority,
      status,
      due_date,
      sent_at,
      document_path,
      document_name,
      document_url,
      correspondence_id,
      recipient_profile:profiles!admin_document_transmissions_recipient_profile_id_fkey(full_name, role),
      recipient_department:departments!admin_document_transmissions_recipient_department_id_fkey(name),
      correspondence:admin_correspondences(reference, subject)
      `
    )
    .eq("church_id", profile.church_id)
    .order("sent_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (dateFrom) query = query.gte("sent_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("sent_at", `${dateTo}T23:59:59`);

  if (q) {
    query = query.or(`reference.ilike.%${q}%,title.ilike.%${q}%`);
  }

  const { data: transmissions } = await query;
  const rows = transmissions ?? [];

  const totalCount = rows.length;
  const inProgressCount = rows.filter((row: any) => row.status === "in_progress").length;
  const completedCount = rows.filter((row: any) => row.status === "completed").length;
  const urgentCount = rows.filter((row: any) => row.priority === "urgent").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet administratif
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Transmission interne des documents
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Consultez, modifiez et archivez les documents transmis aux
                responsables ou départements.
              </p>
            </div>

            <Link
              href="/administration/transmissions/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Send className="h-4 w-4" />
              Nouvelle transmission
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total" value={totalCount} icon={Workflow} />
          <Metric label="En traitement" value={inProgressCount} icon={Inbox} />
          <Metric label="Terminées" value={completedCount} icon={FileText} />
          <Metric label="Urgentes" value={urgentCount} icon={ShieldAlert} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_190px_170px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher référence ou titre..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              <option value="sent">Envoyé</option>
              <option value="received">Reçu</option>
              <option value="read">Lu</option>
              <option value="in_progress">En traitement</option>
              <option value="completed">Terminé</option>
              <option value="returned">Retourné</option>
              <option value="archived">Archivé</option>
            </select>

            <select name="priority" defaultValue={priority} className="filter-input">
              <option value="">Priorités</option>
              <option value="low">Faible</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>

            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Filtrer
              </button>
              <Link href="/administration/transmissions" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Transmissions enregistrées
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} transmission(s) affichée(s).
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <Workflow className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucune transmission trouvée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div
                  key={row.id}
                  className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[0.8fr_1.4fr_0.8fr_0.7fr_0.7fr_0.95fr]"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Référence
                    </p>
                    <p className="mt-1 font-extrabold text-[#03357A]">
                      {row.reference}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-slate-800">
                        {row.title}
                      </p>
                      {(row.document_path || row.document_url) && (
                        <span className="rounded-full bg-[#EAF3FA] px-2 py-0.5 text-xs font-extrabold text-[#03357A]">
                          Document
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.correspondence?.reference
                        ? `Lié à ${row.correspondence.reference}`
                        : "Transmission indépendante"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Destinataire
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {row.recipient_profile?.full_name ||
                        row.recipient_department?.name ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Statut
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(
                        row.status
                      )}`}
                    >
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatDate(row.sent_at)}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getPriorityClass(
                        row.priority
                      )}`}
                    >
                      {PRIORITY_LABELS[row.priority] || row.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <Link
                      href={`/administration/transmissions/${row.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Link>

                    <Link
                      href={`/administration/transmissions/${row.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[#2563EB] ring-1 ring-[#DCEAF5]"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Link>

                    {row.document_path && (
                      <a
                        href={getDocumentDownloadHref({
                          path: row.document_path,
                          filename: row.document_name || row.reference,
                        })}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-[#DCEAF5]"
                      >
                        <Download className="h-4 w-4" />
                        Fichier
                      </a>
                    )}

                    {row.status !== "archived" && (
                      <form action={archiveTransmissionAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="redirectTo" value={currentUrl} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700"
                        >
                          <Archive className="h-4 w-4" />
                          Archiver
                        </button>
                      </form>
                    )}
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

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
