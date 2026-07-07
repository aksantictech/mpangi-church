import { redirect } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Megaphone,
  Send,
  Smartphone,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import NotificationBroadcastForm from "./NotificationBroadcastForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
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

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const [{ count: subscriptionsCount }, { data: logs }] = await Promise.all([
    admin
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("church_id", profile.church_id),

    admin
      .from("notification_logs")
      .select("id, title, body, target, sent_count, failed_count, created_at")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Communication
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Notifications push
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Envoyez une annonce rapide aux fidèles qui ont activé les
                notifications de l’application.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black">{subscriptionsCount ?? 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Appareils abonnés
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Abonnés"
            value={subscriptionsCount ?? 0}
            description="Téléphones / navigateurs inscrits"
            icon={Smartphone}
          />
          <Metric
            label="Historique"
            value={logs?.length ?? 0}
            description="Derniers envois affichés"
            icon={Bell}
          />
          <Metric
            label="Canal"
            value="Push"
            description="Notifications PWA"
            icon={Send}
          />
        </section>

        <NotificationBroadcastForm subscribersCount={subscriptionsCount ?? 0} />

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Megaphone className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  Historique des notifications
                </h2>
                <p className="text-sm text-slate-500">
                  Les 20 dernières notifications envoyées par cette église.
                </p>
              </div>
            </div>
          </div>

          {(logs ?? []).length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucune notification envoyée pour le moment.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Envoyez votre première annonce depuis le formulaire ci-dessus.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {(logs ?? []).map((log: any) => (
                <div
                  key={log.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.55fr_0.55fr_0.75fr]"
                >
                  <div>
                    <p className="font-extrabold text-[#03357A]">
                      {log.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {log.body}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-extrabold">
                      {log.sent_count ?? 0} envoyée(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-extrabold">
                      {log.failed_count ?? 0} échec(s)
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-500">
                    {formatDate(log.created_at)}
                  </p>
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
  description,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  description: string;
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
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
