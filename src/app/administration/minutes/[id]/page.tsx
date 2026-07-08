import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateMeetingStatusAction } from "../actions";

type MeetingDetailPageProps = {
  params: Promise<{
    id: string;
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

export default async function MeetingDetailPage({
  params,
}: MeetingDetailPageProps) {
  const { id } = await params;
  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");

  const { data: meeting } = await admin
    .from("admin_meetings")
    .select(
      `
      *,
      chaired_profile:profiles!admin_meetings_chaired_by_fkey(full_name, role),
      secretary_profile:profiles!admin_meetings_secretary_id_fkey(full_name, role),
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .maybeSingle();

  if (!meeting) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/administration/minutes" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
            <ArrowLeft className="h-4 w-4" />
            Retour aux PV et réunions
          </Link>

          <Link href={`/administration/minutes/${meeting.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                {TYPE_LABELS[meeting.meeting_type] || meeting.meeting_type}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">{meeting.title}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                Date : {formatDate(meeting.meeting_date)} · {meeting.start_time || "--:--"} - {meeting.end_time || "--:--"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-lg font-black">{STATUS_LABELS[meeting.status] || meeting.status}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Statut actuel</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Lieu" value={meeting.location || "-"} icon={CalendarDays} />
          <InfoCard label="Présidée par" value={meeting.chaired_profile?.full_name || "-"} icon={UserRound} />
          <InfoCard label="Secrétaire" value={meeting.secretary_profile?.full_name || "-"} icon={UserRound} />
          <InfoCard label="Département" value={meeting.department?.name || "-"} icon={FileText} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Block title="Ordre du jour" content={meeting.agenda} />
            <Block title="Participants / présences" content={meeting.participants_notes} />
            <Block title="Procès-verbal" content={meeting.minutes} />
            <Block title="Décisions prises" content={meeting.decisions_summary} />
            <Block title="Notes de suivi" content={meeting.followup_notes} />

            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#03357A]">Document joint</h2>

              {meeting.document_path ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#F8FBFD] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">{meeting.document_name || "Document"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {meeting.document_mime_type || "Fichier"} · {formatSize(meeting.document_size)}
                    </p>
                  </div>

                  <a href={getDocumentDownloadHref({ path: meeting.document_path, filename: meeting.document_name || meeting.title })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Aucun fichier chargé.</p>
              )}

              {meeting.document_url && (
                <a href={meeting.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le lien externe
                </a>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Mise à jour du statut</h2>
            <p className="mt-1 text-sm text-slate-500">Changez l’état de cette réunion.</p>

            <form action={updateMeetingStatusAction} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={meeting.id} />

              <select name="status" defaultValue={meeting.status} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10">
                <option value="planned">Planifiée</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
                <option value="archived">Archivée</option>
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

function Block({ title, content }: { title: string; content?: string | null }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#03357A]">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {content || "-"}
      </p>
    </div>
  );
}
