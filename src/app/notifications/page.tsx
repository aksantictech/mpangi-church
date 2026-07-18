import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Send,
  ShieldAlert,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NotificationPermissionCard from "@/components/notifications/NotificationPermissionCard";
import { sendChurchNotification } from "@/lib/notifications/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const MANUAL_NOTIFICATION_ROLES =
  new Set([
    "super_admin",
    "church_admin",
    "admin",
    "admin_eglise",
    "administrateur_eglise",
    "administrator",
    "pastor",
    "pasteur",
    "pasteur_t",
  ]);

type ProfileRow = {
  id: string;
  role: string | null;
  church_id: string;
  status: string | null;
};

type NotificationLogRow = {
  id: string;
  title: string | null;
  body: string | null;
  url: string | null;
  type: string | null;
  status: string | null;
  recipients_count: number | null;
  success_count: number | null;
  failure_count: number | null;
  created_at: string | null;
};

type NotificationsPageProps = {
  searchParams?: Promise<{
    sent?: string;
    error?: string;
    warning?: string;
    success?: string;
    failed?: string;
  }>;
};

function normalizeRole(
  role: string | null
) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

function canSendManualNotifications(
  role: string | null
) {
  const normalizedRole =
    normalizeRole(role);

  return (
    MANUAL_NOTIFICATION_ROLES.has(
      normalizedRole
    ) ||
    normalizedRole.startsWith(
      "pasteur_"
    )
  );
}

function readFormValue(
  formData: FormData,
  key: string
) {
  return String(
    formData.get(key) || ""
  ).trim();
}

function normalizeInternalUrl(
  value: string
) {
  const url =
    value.trim() || "/dashboard";

  if (
    !url.startsWith("/") ||
    url.startsWith("//") ||
    url.includes("\\") ||
    url.length > 2_048
  ) {
    return null;
  }

  return url;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function safeCount(
  value: number | null
) {
  return typeof value === "number"
    ? value
    : 0;
}

function safeQueryCount(
  value: string | undefined
) {
  if (
    !value ||
    !/^\d+$/.test(value)
  ) {
    return "0";
  }

  return value;
}

function getTypeLabel(
  type: string | null
) {
  switch (type) {
    case "manual":
      return "Communication";
    case "publication":
      return "Publication";
    case "teaching":
      return "Enseignement";
    case "event":
      return "Événement";
    case "announcement":
      return "Annonce";
    default:
      return type || "Notification";
  }
}

function getStatusLabel(
  status: string | null
) {
  switch (status) {
    case "sent":
      return "Envoyée";
    case "failed":
      return "Échec";
    case "skipped":
      return "Ignorée";
    default:
      return status || "Inconnu";
  }
}

function getStatusClass(
  status: string | null
) {
  switch (status) {
    case "sent":
      return "bg-green-50 text-green-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "skipped":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

async function getProfile(): Promise<ProfileRow> {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin =
    createAdminClient();

  const {
    data: profileData,
    error: profileError,
  } = await admin
    .from("profiles")
    .select(
      "id, role, church_id, status"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profileData ||
    !profileData.church_id
  ) {
    redirect("/login");
  }

  const profile =
    profileData as ProfileRow;

  if (
    profile.status &&
    profile.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  return profile;
}

async function sendManualNotificationAction(
  formData: FormData
) {
  "use server";

  const profile =
    await getProfile();

  if (
    !canSendManualNotifications(
      profile.role
    )
  ) {
    redirect(
      "/notifications?error=forbidden"
    );
  }

  const title = readFormValue(
    formData,
    "title"
  );

  const body = readFormValue(
    formData,
    "body"
  );

  const requestedUrl = readFormValue(
    formData,
    "url"
  );

  if (!title) {
    redirect(
      "/notifications?error=title"
    );
  }

  if (title.length > 120) {
    redirect(
      "/notifications?error=title_length"
    );
  }

  if (body.length > 500) {
    redirect(
      "/notifications?error=body_length"
    );
  }

  const url =
    normalizeInternalUrl(
      requestedUrl
    );

  if (!url) {
    redirect(
      "/notifications?error=url"
    );
  }

  let result:
    | Awaited<
        ReturnType<
          typeof sendChurchNotification
        >
      >
    | null = null;

  try {
    result =
      await sendChurchNotification({
        churchId:
          profile.church_id,
        title,
        body,
        url,
        type: "manual",
        createdBy: profile.id,
      });
  } catch {
    redirect(
      "/notifications?error=send"
    );
  }

  revalidatePath(
    "/notifications"
  );

  if (
    !result ||
    result.recipientsCount === 0
  ) {
    const warning =
      result?.warning?.startsWith(
        "Aucun appareil"
      )
        ? "no_subscribers"
        : "subscriptions";

    redirect(
      `/notifications?warning=${warning}`
    );
  }

  if (result.successCount === 0) {
    redirect(
      "/notifications?error=delivery"
    );
  }

  const query =
    new URLSearchParams({
      sent: "1",
      success: String(
        result.successCount
      ),
      failed: String(
        result.failureCount
      ),
    });

  redirect(
    `/notifications?${query.toString()}`
  );
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = searchParams
    ? await searchParams
    : {};

  const profile =
    await getProfile();

  const admin =
    createAdminClient();

  const [
    subscribersResult,
    logsResult,
  ] = await Promise.all([
    admin
      .from(
        "church_notification_subscriptions"
      )
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        profile.church_id
      )
      .eq("active", true),

    admin
      .from(
        "church_notification_logs"
      )
      .select(
        `
          id,
          title,
          body,
          url,
          type,
          status,
          recipients_count,
          success_count,
          failure_count,
          created_at
        `
      )
      .eq(
        "church_id",
        profile.church_id
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(12),
  ]);

  const subscribersCount =
    subscribersResult.count ?? 0;

  const logs = (logsResult.data ??
    []) as NotificationLogRow[];

  const canSend =
    canSendManualNotifications(
      profile.role
    );

  const successfulDeliveries =
    safeQueryCount(
      params.success
    );

  const failedDeliveries =
    safeQueryCount(
      params.failed
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BellRing className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Communication
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Notifications internet
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Gérez les abonnements et
                envoyez les communications
                importantes aux appareils
                abonnés à votre église.
              </p>
            </div>
          </div>
        </section>

        {params.sent === "1" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-extrabold text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Notification envoyée à{" "}
              {successfulDeliveries}{" "}
              appareil(s).
            </div>

            {failedDeliveries !== "0" && (
              <p className="mt-2 text-xs font-bold text-amber-700">
                {failedDeliveries}{" "}
                appareil(s) n’ont pas reçu
                la notification.
              </p>
            )}
          </div>
        )}

        {params.warning ===
          "no_subscribers" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Aucun appareil n’est encore
            abonné à cette église.
          </div>
        )}

        {params.warning ===
          "subscriptions" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Les abonnements n’ont pas pu
            être chargés. Vérifiez la
            configuration de la base.
          </div>
        )}

        {params.error && (
          <NotificationError
            code={params.error}
          />
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Bell className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Appareils abonnés
            </p>

            <h2 className="mt-1 text-3xl font-black text-[#03357A]">
              {subscribersCount}
            </h2>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="font-black text-[#03357A]">
              État du système
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Les notifications peuvent
              accompagner les publications,
              enseignements, événements et
              communications manuelles. Les
              visiteurs peuvent s’abonner
              depuis les pages publiques de
              l’église.
            </p>
          </div>
        </section>

        <NotificationPermissionCard />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          {canSend ? (
            <form
              action={
                sendManualNotificationAction
              }
              className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Send className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#03357A]">
                    Envoyer une communication
                  </h2>

                  <p className="text-sm text-slate-500">
                    Message envoyé à tous les
                    appareils actifs de cette
                    église.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-extrabold text-[#03357A]">
                    Titre
                  </span>

                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder="Ex. Nouvel enseignement disponible"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-extrabold text-[#03357A]">
                    Message
                  </span>

                  <textarea
                    name="body"
                    rows={4}
                    maxLength={500}
                    placeholder="Texte court de la notification"
                    className={`${inputClass} py-3`}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-extrabold text-[#03357A]">
                    Lien interne à ouvrir
                  </span>

                  <input
                    name="url"
                    defaultValue="/dashboard"
                    maxLength={2048}
                    placeholder="/publications"
                    className={inputClass}
                  />

                  <span className="block text-xs font-semibold text-slate-400">
                    Utilisez une route interne
                    commençant par /.
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
                >
                  <Send className="h-4 w-4" />
                  Envoyer la notification
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 shrink-0 text-amber-800" />

                <div>
                  <h2 className="font-black text-amber-950">
                    Envoi manuel limité
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Seuls les administrateurs
                    et pasteurs autorisés
                    peuvent envoyer une
                    notification générale.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#03357A]">
              Historique récent
            </h2>

            <div className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <p className="rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-500">
                  Aucune notification
                  envoyée.
                </p>
              ) : (
                logs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                        {getTypeLabel(
                          log.type
                        )}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getStatusClass(
                          log.status
                        )}`}
                      >
                        {getStatusLabel(
                          log.status
                        )}
                      </span>
                    </div>

                    <p className="mt-3 break-words font-black text-[#03357A]">
                      {log.title ||
                        "Notification"}
                    </p>

                    {log.body && (
                      <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                        {log.body}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                      <div className="rounded-xl bg-white p-2 text-slate-600">
                        {safeCount(
                          log.recipients_count
                        )}
                        <span className="block text-[10px] text-slate-400">
                          destinataire(s)
                        </span>
                      </div>

                      <div className="rounded-xl bg-green-50 p-2 text-green-700">
                        {safeCount(
                          log.success_count
                        )}
                        <span className="block text-[10px] text-green-600">
                          reçu(s)
                        </span>
                      </div>

                      <div className="rounded-xl bg-red-50 p-2 text-red-700">
                        {safeCount(
                          log.failure_count
                        )}
                        <span className="block text-[10px] text-red-600">
                          échec(s)
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(
                        log.created_at
                      )}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function NotificationError({
  code,
}: {
  code: string;
}) {
  const messages: Record<
    string,
    string
  > = {
    title:
      "Le titre de la notification est obligatoire.",
    title_length:
      "Le titre ne peut pas dépasser 120 caractères.",
    body_length:
      "Le message ne peut pas dépasser 500 caractères.",
    url:
      "Le lien doit être une route interne commençant par /.",
    forbidden:
      "Votre rôle ne permet pas d’envoyer une notification générale.",
    delivery:
      "La notification n’a été reçue par aucun appareil. Vérifiez les variables VAPID et les abonnements.",
    send:
      "Une erreur inattendue a empêché l’envoi de la notification.",
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

        <p>
          {messages[code] ||
            "Une erreur est survenue."}
        </p>
      </div>
    </div>
  );
}