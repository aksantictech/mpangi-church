import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ListChecks,
  Pencil,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateAdministrativeTaskStatusAction } from "../actions";

type TaskDetailPageProps = {
  params: Promise<{
    id: string;
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
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");

  const [{ data: task }, { data: updates }] = await Promise.all([
    admin
      .from("admin_tasks")
      .select(
        `
        *,
        assigned_profile:profiles!admin_tasks_assigned_to_fkey(full_name, role),
        department:departments(name),
        related_correspondence:admin_correspondences(reference, subject),
        related_transmission:admin_document_transmissions(reference, title)
        `
      )
      .eq("church_id", profile.church_id)
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("admin_task_updates")
      .select(
        `
        id,
        status,
        note,
        created_at,
        actor:profiles!admin_task_updates_created_by_fkey(full_name, role)
        `
      )
      .eq("church_id", profile.church_id)
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!task) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/administration/tasks" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
            <ArrowLeft className="h-4 w-4" />
            Retour aux tâches
          </Link>

          <Link href={`/administration/tasks/${task.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Tâche administrative
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">{task.title}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                Responsable : {task.assigned_profile?.full_name || "-"} · Échéance : {formatDate(task.due_date)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-lg font-black">{STATUS_LABELS[task.status] || task.status}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Statut actuel
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Priorité" value={PRIORITY_LABELS[task.priority] || task.priority} icon={ListChecks} />
          <InfoCard label="Date début" value={formatDate(task.start_date)} icon={CalendarDays} />
          <InfoCard label="Date limite" value={formatDate(task.due_date)} icon={CalendarDays} />
          <InfoCard label="Département" value={task.department?.name || "-"} icon={UserRound} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Détails de la tâche</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Detail label="Catégorie" value={task.category} />
              <Detail label="Responsable" value={task.assigned_profile?.full_name || "-"} />
              <Detail
                label="Courrier lié"
                value={task.related_correspondence?.reference ? `${task.related_correspondence.reference} — ${task.related_correspondence.subject}` : "-"}
              />
              <Detail
                label="Transmission liée"
                value={task.related_transmission?.reference ? `${task.related_transmission.reference} — ${task.related_transmission.title}` : "-"}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {task.description || "Aucune description."}
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
              <h3 className="font-extrabold text-[#03357A]">Document lié</h3>

              {task.document_path ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">{task.document_name || "Document"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {task.document_mime_type || "Fichier"} · {formatSize(task.document_size)}
                    </p>
                  </div>

                  <a href={getDocumentDownloadHref({ path: task.document_path, filename: task.document_name || task.title })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Aucun fichier chargé.</p>
              )}

              {task.document_url && (
                <a href={task.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le lien externe
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">Mise à jour rapide</h2>
                <p className="text-sm text-slate-500">Changez le statut et ajoutez une note.</p>
              </div>
            </div>

            <form action={updateAdministrativeTaskStatusAction} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={task.id} />

              <select name="status" defaultValue={task.status} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10">
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="waiting">En attente</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
                <option value="archived">Archivé</option>
              </select>

              <textarea name="note" rows={4} placeholder="Note de suivi..." className="w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" />

              <button type="submit" className="w-full rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                Mettre à jour
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">Historique</h2>

          <div className="mt-5 space-y-3">
            {(updates ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Aucun historique.</p>
            ) : (
              (updates ?? []).map((update: any) => (
                <div key={update.id} className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <p className="font-extrabold text-[#03357A]">{STATUS_LABELS[update.status] || update.status || "Note"}</p>
                    <p className="text-xs font-bold text-slate-400">{formatDateTime(update.created_at)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{update.note || "-"}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    Par : {update.actor?.full_name || update.actor?.role || "-"}
                  </p>
                </div>
              ))
            )}
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
