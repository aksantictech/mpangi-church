import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Clock3,
  Download,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { archiveAdministrativeTaskAction } from "./actions";

type TasksPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    assignedTo?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  waiting: "En attente",
  completed: "Terminé",
  cancelled: "Annulé",
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
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "archived" || status === "cancelled") return "bg-slate-100 text-slate-700";
  if (status === "waiting") return "bg-orange-50 text-orange-700";
  if (status === "in_progress") return "bg-blue-50 text-blue-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-orange-50 text-orange-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildCurrentUrl(params: {
  q: string;
  status: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
  assignedTo: string;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.assignedTo) query.set("assignedTo", params.assignedTo);
  const value = query.toString();
  return value ? `/administration/tasks?${value}` : "/administration/tasks";
}

export default async function AdministrativeTasksPage({
  searchParams,
}: TasksPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const status = params.status || "";
  const priority = params.priority || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const assignedTo = params.assignedTo || "";
  const currentUrl = buildCurrentUrl({ q, status, priority, dateFrom, dateTo, assignedTo });
  const currentDate = today();

  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");

  const { data: users } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("church_id", profile.church_id)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  let query = admin
    .from("admin_tasks")
    .select(
      `
      id,
      title,
      priority,
      status,
      start_date,
      due_date,
      document_path,
      document_name,
      assigned_profile:profiles!admin_tasks_assigned_to_fkey(full_name, role),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  if (dateFrom) query = query.gte("due_date", dateFrom);
  if (dateTo) query = query.lte("due_date", dateTo);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data: tasks } = await query;
  const rows = tasks ?? [];

  const openCount = rows.filter((row: any) =>
    ["todo", "in_progress", "waiting"].includes(row.status)
  ).length;
  const urgentCount = rows.filter((row: any) => row.priority === "urgent").length;
  const lateCount = rows.filter(
    (row: any) =>
      row.due_date &&
      row.due_date < currentDate &&
      !["completed", "archived", "cancelled"].includes(row.status)
  ).length;

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
                Tâches administratives
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Responsables, échéances, priorités, documents et suivi d’avancement.
              </p>
            </div>

            <Link
              href="/administration/tasks/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Total" value={rows.length} icon={ListChecks} />
          <Metric label="Ouvertes" value={openCount} icon={Clock3} />
          <Metric label="Urgentes" value={urgentCount} icon={AlertTriangle} />
          <Metric label="En retard" value={lateCount} icon={Clock3} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_170px_170px_180px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher une tâche..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="waiting">En attente</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
              <option value="archived">Archivé</option>
            </select>

            <select name="priority" defaultValue={priority} className="filter-input">
              <option value="">Priorités</option>
              <option value="low">Faible</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>

            <select name="assignedTo" defaultValue={assignedTo} className="filter-input">
              <option value="">Tous responsables</option>
              {(users ?? []).map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.role || "Utilisateur"}
                </option>
              ))}
            </select>

            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Filtrer
              </button>
              <Link href="/administration/tasks" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Tâches enregistrées
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} tâche(s) affichée(s).
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <ListChecks className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucune tâche trouvée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => {
                const isLate =
                  row.due_date &&
                  row.due_date < currentDate &&
                  !["completed", "archived", "cancelled"].includes(row.status);

                return (
                  <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.3fr_0.75fr_0.62fr_0.95fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-[#03357A]">{row.title}</p>
                        {isLate && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-extrabold text-red-700">En retard</span>}
                        {row.priority === "urgent" && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-extrabold text-orange-700">Urgent</span>}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Responsable : {row.assigned_profile?.full_name || "-"} · Département : {row.department?.name || "-"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/administration/tasks/${row.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]">
                          <Eye className="h-4 w-4" />
                          Voir
                        </Link>

                        <Link href={`/administration/tasks/${row.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[#2563EB] ring-1 ring-[#DCEAF5]">
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
                          <form action={archiveAdministrativeTaskAction}>
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
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Échéance</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{formatDate(row.due_date)}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">Début : {formatDate(row.start_date)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getPriorityClass(row.priority)}`}>
                        {PRIORITY_LABELS[row.priority] || row.priority}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-[#F8FBFD] p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Résumé</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Cette tâche est assignée à {row.assigned_profile?.full_name || "aucun responsable"}.
                      </p>
                    </div>
                  </div>
                );
              })}
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
