import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Bell, BellRing, Send } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import NotificationPermissionCard from "@/components/notifications/NotificationPermissionCard";
import { sendChurchNotification } from "@/lib/notifications/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.church_id) redirect("/login");

  if (profile.status && profile.status !== "active") redirect("/login");

  return profile;
}

async function sendManualNotificationAction(formData: FormData) {
  "use server";

  const profile = await getProfile();

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const url = String(formData.get("url") || "/dashboard").trim();

  if (!title) {
    redirect("/notifications?error=title");
  }

  await sendChurchNotification({
    churchId: profile.church_id,
    title,
    body,
    url,
    type: "manual",
    createdBy: profile.id,
  });

  revalidatePath("/notifications");
  redirect("/notifications?sent=1");
}

type NotificationsPageProps = {
  searchParams?: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = searchParams ? await searchParams : {};
  const profile = await getProfile();
  const admin = createAdminClient();

  const [{ count: subscribersCount }, { data: logs }] = await Promise.all([
    admin
      .from("church_notification_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("active", true),

    admin
      .from("church_notification_logs")
      .select("*")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

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
                Activez les notifications sur les appareils et envoyez les communications importantes aux fidèles et utilisateurs abonnés.
              </p>
            </div>
          </div>
        </section>

        {params.sent && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
            Notification envoyée.
          </div>
        )}

        {params.error === "title" && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-extrabold text-red-700">
            Le titre de la notification est obligatoire.
          </div>
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
              {subscribersCount ?? 0}
            </h2>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="font-black text-[#03357A]">
              État du système
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Les notifications automatiques sont envoyées quand un enseignement est publié.
              Les visiteurs de la page publique peuvent aussi s’abonner depuis la page des enseignements.
            </p>
          </div>
        </section>

        <NotificationPermissionCard />

        <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <form
            action={sendManualNotificationAction}
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
                  Message internet envoyé aux appareils abonnés.
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
                  placeholder="Texte court de la notification"
                  className={`${inputClass} py-3`}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-extrabold text-[#03357A]">
                  Lien à ouvrir
                </span>
                <input
                  name="url"
                  defaultValue="/dashboard"
                  className={inputClass}
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#03357A]">
              Historique récent
            </h2>

            <div className="mt-4 space-y-3">
              {(logs ?? []).length === 0 ? (
                <p className="rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-500">
                  Aucune notification envoyée.
                </p>
              ) : (
                (logs ?? []).map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                  >
                    <p className="font-black text-[#03357A]">{log.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{log.body}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {log.success_count}/{log.recipients_count} reçu(s)
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
