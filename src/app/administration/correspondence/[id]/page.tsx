import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  History,
  Lock,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";
import { updateCorrespondenceStatusAction } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

const TYPE: Record<string, string> = {
  incoming: "Courrier entrant",
  outgoing: "Courrier sortant",
  internal: "Courrier interne",
};

const STATUS: Record<string, string> = {
  draft: "Brouillon",
  received: "Reçu",
  sent: "Envoyé",
  in_review: "En traitement",
  transmitted: "Transmis",
  closed: "Clôturé",
  archived: "Archivé",
};

const PRIORITY: Record<string, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      ...(withTime
        ? {
            hour: "2-digit" as const,
            minute: "2-digit" as const,
          }
        : {}),
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatSize(value?: number | null) {
  if (!value) return "-";
  return value < 1024 * 1024
    ? `${Math.round(value / 1024)} Ko`
    : `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function canValidateCorrespondence(role?: string | null) {
  const normalized = normalizeRoleCode(role);
  return ["pasteur_t", "pastor", "church_admin", "admin_eglise"].includes(
    normalized
  );
}

export default async function CorrespondenceDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  const { data: correspondence } = await admin
    .from("admin_correspondences")
    .select(
      `
      *,
      departments(name),
      assigned_profile:profiles!admin_correspondences_assigned_to_fkey(full_name, role),
      validated_profile:profiles!admin_correspondences_validated_by_fkey(full_name)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .maybeSingle();

  if (!correspondence) notFound();

  // Viewing the document clears this user's internal correspondence alert.
  await admin
    .from("admin_correspondence_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("church_id", profile.church_id)
    .eq("profile_id", profile.id)
    .eq("correspondence_id", id)
    .is("read_at", null);

  const { data: historyRows } = await admin
    .from("admin_correspondence_history")
    .select(
      `
      id,
      action_type,
      previous_status,
      status,
      comment,
      created_at,
      created_profile:profiles!admin_correspondence_history_created_by_fkey(full_name,role)
      `
    )
    .eq("church_id", profile.church_id)
    .eq("correspondence_id", id)
    .order("created_at", { ascending: false });

  const assignedProfile = firstItem(correspondence.assigned_profile);
  const validatedProfile = firstItem(correspondence.validated_profile);
  const canValidate = canValidateCorrespondence(profile.role);
  const history = historyRows ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/administration/correspondence"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux courriers
        </Link>

        {query.updated === "1" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-black text-green-700">
            Le traitement du courrier a été enregistré et les personnes concernées ont été notifiées.
          </div>
        )}

        {query.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
            {query.error === "comment"
              ? "Ajoutez obligatoirement un commentaire avant de mettre à jour le traitement."
              : "Impossible d’enregistrer la mise à jour du courrier."}
          </div>
        )}

        <section
          className={[
            "rounded-3xl p-6 text-white shadow-lg",
            correspondence.priority === "urgent"
              ? "bg-gradient-to-br from-red-700 via-red-600 to-orange-500 shadow-red-900/20"
              : "bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] shadow-blue-900/20",
          ].join(" ")}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                  {TYPE[correspondence.type] || correspondence.type}
                </p>
                {correspondence.priority === "urgent" && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700">
                    URGENT
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-extrabold">
                {correspondence.subject}
              </h1>
              <p className="mt-2 text-sm leading-7 text-white/90">
                Référence : {correspondence.reference} · Date :{" "}
                {formatDate(correspondence.correspondence_date)}
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="rounded-2xl bg-white/15 px-5 py-4 ring-1 ring-white/20">
                <p className="text-lg font-black">
                  {STATUS[correspondence.status] || correspondence.status}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-white/75">
                  Statut actuel
                </p>
              </div>

              {correspondence.validated_at && (
                <div className="rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-black ring-1 ring-white/20">
                  <CheckCircle2 className="mx-auto mb-1 h-5 w-5" />
                  Validé
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Info
            label="Priorité"
            value={PRIORITY[correspondence.priority] || correspondence.priority}
            icon={Lock}
            urgent={correspondence.priority === "urgent"}
          />
          <Info
            label="Date courrier"
            value={formatDate(correspondence.correspondence_date)}
            icon={CalendarDays}
          />
          <Info
            label="Date limite"
            value={formatDate(correspondence.due_date)}
            icon={CalendarDays}
          />
          <Info
            label="Département"
            value={correspondence.departments?.name || "-"}
            icon={UserRound}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Informations du courrier
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Detail label="Expéditeur" value={correspondence.sender_name} />
                <Detail label="Contact expéditeur" value={correspondence.sender_contact} />
                <Detail label="Destinataire" value={correspondence.recipient_name} />
                <Detail label="Contact destinataire" value={correspondence.recipient_contact} />
                <Detail
                  label="Responsable assigné"
                  value={assignedProfile?.full_name || assignedProfile?.role || "-"}
                />
                <Detail
                  label="Confidentiel"
                  value={correspondence.confidential ? "Oui" : "Non"}
                />
              </div>

              {correspondence.validated_at && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-black">
                    <ShieldCheck className="h-5 w-5" />
                    Document validé
                  </div>
                  <p className="mt-1">
                    {validatedProfile?.full_name || "Responsable autorisé"} ·{" "}
                    {formatDate(correspondence.validated_at, true)}
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
                <h3 className="font-extrabold text-[#03357A]">Document joint</h3>

                {correspondence.document_path ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800">
                        {correspondence.document_name || "Document"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {correspondence.document_mime_type || "Fichier"} ·{" "}
                        {formatSize(correspondence.document_size)}
                      </p>
                    </div>
                    <a
                      href={getDocumentDownloadHref({
                        path: correspondence.document_path,
                        filename:
                          correspondence.document_name || correspondence.reference,
                      })}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Aucun fichier chargé.
                  </p>
                )}

                {correspondence.document_url && (
                  <a
                    href={correspondence.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir le lien externe
                  </a>
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Notes internes initiales
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {correspondence.notes || "Aucune note."}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#03357A]">
                    Historique de traitement
                  </h2>
                  <p className="text-sm text-slate-500">
                    Chaque commentaire et changement de statut est conservé.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {history.length === 0 ? (
                  <p className="rounded-2xl bg-[#F8FBFD] p-5 text-sm text-slate-500">
                    Aucun historique enregistré pour le moment.
                  </p>
                ) : (
                  history.map((item: any) => {
                    const actor = firstItem(item.created_profile);
                    const validated = item.action_type === "validated";

                    return (
                      <article
                        key={item.id}
                        className={[
                          "rounded-2xl border p-4",
                          validated
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-[#DCEAF5] bg-[#F8FBFD]",
                        ].join(" ")}
                      >
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <p className="font-black text-[#03357A]">
                            {actor?.full_name || "Utilisateur"}
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            {formatDate(item.created_at, true)}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                          {item.previous_status && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                              {STATUS[item.previous_status] || item.previous_status}
                            </span>
                          )}
                          {item.status && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                              → {STATUS[item.status] || item.status}
                            </span>
                          )}
                          {validated && (
                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-white">
                              Document validé
                            </span>
                          )}
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {item.comment || "Aucun commentaire."}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="h-fit rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm xl:sticky xl:top-24">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  Traitement du courrier
                </h2>
                <p className="text-sm text-slate-500">
                  Statut + commentaire obligatoires.
                </p>
              </div>
            </div>

            <form action={updateCorrespondenceStatusAction} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={correspondence.id} />

              <label className="block space-y-2">
                <span className="text-sm font-black text-[#03357A]">Statut</span>
                <select
                  name="status"
                  defaultValue={correspondence.status}
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                >
                  <option value="draft">Brouillon</option>
                  <option value="received">Reçu</option>
                  <option value="sent">Envoyé</option>
                  <option value="in_review">En traitement</option>
                  <option value="transmitted">Transmis</option>
                  <option value="closed">Clôturé</option>
                  <option value="archived">Archivé</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-black text-[#03357A]">
                  <MessageSquareText className="h-4 w-4" />
                  Commentaire de traitement
                </span>
                <textarea
                  name="comment"
                  required
                  rows={5}
                  placeholder="Décision, instruction, observation, suite à donner..."
                  className="w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                />
              </label>

              {canValidate && !correspondence.validated_at && (
                <label className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <input
                    type="checkbox"
                    name="validate_document"
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    <strong className="block">Valider ce document</strong>
                    La validation sera enregistrée avec votre identité, la date et votre commentaire.
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
              >
                Enregistrer le traitement
              </button>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({
  label,
  value,
  icon: Icon,
  urgent = false,
}: {
  label: string;
  value: string;
  icon: any;
  urgent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border p-5 shadow-sm",
        urgent
          ? "border-red-200 bg-red-50"
          : "border-[#DCEAF5] bg-white",
      ].join(" ")}
    >
      <Icon className={`h-5 w-5 ${urgent ? "text-red-700" : "text-[#03357A]"}`} />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 font-extrabold ${urgent ? "text-red-700" : "text-[#03357A]"}`}>
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">{value || "-"}</p>
    </div>
  );
}
