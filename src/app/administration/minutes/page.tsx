import Link from "next/link";
import {
  Archive,
  CalendarDays,
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
import { archiveMeetingAction } from "./actions";

type MeetingsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifiée",
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  archived: "Archivée",
};

const TYPE_LABELS: Record<string, string> = {
  general: "Générale",
  pastoral: "Pastorale",
  administration: "Administration",
  finance: "Finance",
  patrimony: "Patrimoine",
  department: "Département",
  project: "Projet",
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
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "archived" || status === "cancelled") return "bg-slate-100 text-slate-700";
  if (status === "ongoing") return "bg-orange-50 text-orange-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function buildCurrentUrl(params: {
  q: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  const value = query.toString();
  return value ? `/administration/minutes?${value}` : "/administration/minutes";
}

export default async function MeetingsMinutesPage({
  searchParams,
}: MeetingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const status = params.status || "";
  const type = params.type || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const currentUrl = buildCurrentUrl({ q, status, type, dateFrom, dateTo });

  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");

  let query = admin
    .from("admin_meetings")
    .select(
      `
      id,
      title,
      meeting_type,
      meeting_date,
      start_time,
      end_time,
      location,
      status,
      document_path,
      document_name,
      chaired_profile:profiles!admin_meetings_chaired_by_fkey(full_name, role),
      secretary_profile:profiles!admin_meetings_secretary_id_fkey(full_name, role),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .order("meeting_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("meeting_type", type);
  if (dateFrom) query = query.gte("meeting_date", dateFrom);
  if (dateTo) query = query.lte("meeting_date", dateTo);
  if (q) query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%`);

  const { data: meetings } = await query;
  const rows = meetings ?? [];

  const completedCount = rows.filter((row: any) => row.status === "completed").length;
  const plannedCount = rows.filter((row: any) => row.status === "planned").length;
  const ongoingCount = rows.filter((row: any) => row.status === "ongoing").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet administratif
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">PV et réunions</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Planifiez les réunions, rédigez les procès-verbaux, conservez les décisions et les documents liés.
              </p>
            </div>

            <Link
              href="/administration/minutes/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-4 w-4" />
              Nouvelle réunion
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total" value={rows.length} icon={CalendarDays} />
          <Metric label="Planifiées" value={plannedCount} icon={CalendarDays} />
          <Metric label="En cours" value={ongoingCount} icon={FileText} />
          <Metric label="Terminées" value={completedCount} icon={FileText} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_180px_180px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher titre ou lieu..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              <option value="planned">Planifiée</option>
              <option value="ongoing">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
              <option value="archived">Archivée</option>
            </select>

            <select name="type" defaultValue={type} className="filter-input">
              <option value="">Tous types</option>
              <option value="general">Générale</option>
              <option value="pastoral">Pastorale</option>
              <option value="administration">Administration</option>
              <option value="finance">Finance</option>
              <option value="patrimony">Patrimoine</option>
              <option value="department">Département</option>
              <option value="project">Projet</option>
            </select>

            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Filtrer
              </button>
              <Link href="/administration/minutes" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Réunions enregistrées
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} réunion(s) affichée(s).
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucune réunion trouvée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.25fr_0.75fr_0.6fr_0.95fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[#03357A]">{row.title}</p>
                      {row.document_path && (
                        <span className="rounded-full bg-[#EAF3FA] px-2 py-0.5 text-xs font-extrabold text-[#03357A]">
                          Document
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Présidée par : {row.chaired_profile?.full_name || "-"} · Secrétaire : {row.secretary_profile?.full_name || "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/administration/minutes/${row.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]">
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>

                      <Link href={`/administration/minutes/${row.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[#2563EB] ring-1 ring-[#DCEAF5]">
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>

                      {row.document_path && (
                        <a href={getDocumentDownloadHref({ path: row.document_path, filename: row.document_name || row.title })} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-[#DCEAF5]">
                          <Download className="h-4 w-4" />
                          Fichier
                        </a>
                      )}

                      {row.status !== "archived" && (
                        <form action={archiveMeetingAction}>
                          <input type="hidden" name="id" value={row.id} />
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
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{formatDate(row.meeting_date)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {row.start_time || "--:--"} - {row.end_time || "--:--"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {TYPE_LABELS[row.meeting_type] || row.meeting_type}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F8FBFD] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Lieu / département</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {row.location || "-"} · {row.department?.name || "-"}
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

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
