import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Download,
  FileText,
  Inbox,
  MailCheck,
  Search,
  Send,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateTransmissionStatusAction } from "../transmissions/actions";

type AdministrativeInboxPageProps = {
  searchParams?: Promise<{
    box?: string;
    q?: string;
    status?: string;
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

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
  "administration_manager",
  "admin_manager",
  "charged_administration",
  "charge_administration",
  "secretaire",
  "secretary",
]);

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function canSeeGlobalAdministrativeInbox(role?: string | null) {
  return ADMIN_ROLES.has(normalizeRole(role));
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

function getStatusClass(status: string) {
  if (status === "completed" || status === "archived") {
    return "bg-green-50 text-green-700";
  }

  if (status === "returned") {
    return "bg-red-50 text-red-700";
  }

  if (status === "in_progress") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "read" || status === "received") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-[#EAF3FA] text-[#03357A]";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-orange-50 text-orange-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdministrativeInboxPage({
  searchParams,
}: AdministrativeInboxPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const box = resolvedSearchParams.box || "inbox";
  const q = (resolvedSearchParams.q || "").trim();
  const status = resolvedSearchParams.status || "";

  const { admin, profile } = await requireChurchModuleAccess(
    "document_transmissions"
  );

  const globalView = canSeeGlobalAdministrativeInbox(profile.role);
  const today = getToday();

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
      received_at,
      completed_at,
      document_path,
      document_name,
      document_url,
      sender_profile:profiles!admin_document_transmissions_sender_profile_id_fkey(full_name, role),
      recipient_profile:profiles!admin_document_transmissions_recipient_profile_id_fkey(full_name, role),
      recipient_department:departments!admin_document_transmissions_recipient_department_id_fkey(name),
      correspondence:admin_correspondences(reference, subject)
      `
    )
    .eq("church_id", profile.church_id)
    .order("sent_at", { ascending: false })
    .limit(200);

  if (box === "sent") {
    query = query.eq("sender_profile_id", profile.id);
  } else if (box === "urgent") {
    query = query.eq("priority", "urgent").not("status", "in", "(completed,archived)");
    if (!globalView) {
      query = query.eq("recipient_profile_id", profile.id);
    }
  } else if (box === "late") {
    query = query.lt("due_date", today).not("status", "in", "(completed,archived)");
    if (!globalView) {
      query = query.eq("recipient_profile_id", profile.id);
    }
  } else if (box === "all") {
    if (!globalView) {
      query = query.or(
        `recipient_profile_id.eq.${profile.id},sender_profile_id.eq.${profile.id}`
      );
    }
  } else {
    query = query.eq("recipient_profile_id", profile.id);
  }

  if (status) query = query.eq("status", status);

  if (q) {
    query = query.or(`reference.ilike.%${q}%,title.ilike.%${q}%`);
  }

  const { data: rowsData } = await query;
  const rows = rowsData ?? [];

  const inboxCount = rows.filter((row: any) =>
    box === "inbox" ? true : row.status !== "completed"
  ).length;
  const urgentCount = rows.filter((row: any) => row.priority === "urgent").length;
  const lateCount = rows.filter(
    (row: any) =>
      row.due_date &&
      row.due_date < today &&
      !["completed", "archived"].includes(row.status)
  ).length;
  const completedCount = rows.filter((row: any) => row.status === "completed").length;

  const tabs = [
    { label: "Reçus", href: "/administration/inbox?box=inbox", value: "inbox", icon: Inbox },
    { label: "Envoyés", href: "/administration/inbox?box=sent", value: "sent", icon: Send },
    { label: "Urgents", href: "/administration/inbox?box=urgent", value: "urgent", icon: AlertTriangle },
    { label: "En retard", href: "/administration/inbox?box=late", value: "late", icon: Clock3 },
    ...(globalView
      ? [{ label: "Tout", href: "/administration/inbox?box=all", value: "all", icon: MailCheck }]
      : []),
  ];

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
                Boîte administrative
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Suivez les documents reçus, envoyés, urgents et en retard. Les
                responsables administratifs peuvent superviser l’ensemble des
                transmissions.
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
          <Metric label="Documents affichés" value={rows.length} icon={MailCheck} />
          <Metric label="À traiter" value={inboxCount} icon={Inbox} />
          <Metric label="Urgents" value={urgentCount} icon={AlertTriangle} />
          <Metric label="En retard" value={lateCount} icon={Clock3} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = box === tab.value;

              return (
                <Link
                  key={tab.value}
                  href={tab.href}
                  className={`inline-flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                    active
                      ? "bg-[#03357A] text-white"
                      : "bg-[#EAF3FA] text-[#03357A] hover:bg-[#DCEAF5]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input type="hidden" name="box" value={box} />

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher référence ou titre..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="">Tous statuts</option>
              <option value="sent">Envoyé</option>
              <option value="received">Reçu</option>
              <option value="read">Lu</option>
              <option value="in_progress">En traitement</option>
              <option value="completed">Terminé</option>
              <option value="returned">Retourné</option>
              <option value="archived">Archivé</option>
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
              >
                Filtrer
              </button>

              <Link
                href={`/administration/inbox?box=${box}`}
                className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Documents administratifs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} document(s) affiché(s). {completedCount} terminé(s).
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <MailCheck className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucun document trouvé.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Créez une nouvelle transmission ou changez de filtre.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => {
                const isLate =
                  row.due_date &&
                  row.due_date < today &&
                  !["completed", "archived"].includes(row.status);

                return (
                  <div
                    key={row.id}
                    className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.1fr_0.75fr_0.55fr_0.5fr]"
                  >
                    <div>
                      <Link
                        href={`/administration/transmissions/${row.id}`}
                        className="group"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-[#03357A] group-hover:text-[#2563EB]">
                            {row.title}
                          </p>

                          {isLate && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-extrabold text-red-700">
                              En retard
                            </span>
                          )}

                          {row.priority === "urgent" && (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-extrabold text-orange-700">
                              Urgent
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {row.reference} ·{" "}
                          {row.correspondence?.reference
                            ? `Courrier ${row.correspondence.reference}`
                            : "Transmission indépendante"}
                        </p>
                      </Link>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.document_path && (
                          <a
                            href={getDocumentDownloadHref({
                              path: row.document_path,
                              filename: row.document_name || row.reference,
                            })}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </a>
                        )}

                        <Link
                          href={`/administration/transmissions/${row.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[#2563EB] ring-1 ring-[#DCEAF5]"
                        >
                          Ouvrir
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Acteurs
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        De : {row.sender_profile?.full_name || "-"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        À :{" "}
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

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getPriorityClass(
                          row.priority
                        )}`}
                      >
                        {PRIORITY_LABELS[row.priority] || row.priority}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Actions rapides
                      </p>

                      <form
                        action={updateTransmissionStatusAction}
                        className="mt-2 space-y-2"
                      >
                        <input type="hidden" name="id" value={row.id} />

                        <select
                          name="status"
                          defaultValue={row.status}
                          className="min-h-10 w-full rounded-2xl border border-[#DCEAF5] bg-white px-3 text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value="received">Reçu</option>
                          <option value="read">Lu</option>
                          <option value="in_progress">En traitement</option>
                          <option value="completed">Terminé</option>
                          <option value="returned">Retourné</option>
                          <option value="archived">Archivé</option>
                        </select>

                        <input
                          type="hidden"
                          name="note"
                          value="Mise à jour rapide depuis la boîte administrative."
                        />

                        <button
                          type="submit"
                          className="w-full rounded-2xl bg-[#03357A] px-3 py-2 text-xs font-extrabold text-white"
                        >
                          Mettre à jour
                        </button>
                      </form>

                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Échéance : {formatDate(row.due_date)}
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
