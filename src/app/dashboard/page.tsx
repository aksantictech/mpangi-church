import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import MetricCard from "@/components/dashboard/MetricCard";
import RoleDashboardPanel from "@/components/dashboard/RoleDashboardPanel";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

type DashboardChurch = {
  id: string;
  name: string | null;
  public_name: string | null;
  slug: string | null;
  logo_url: string | null;
  dashboard_welcome_message:
    | string
    | null;
};

type PublicRequestType =
  | "prayer"
  | "appointment"
  | "join"
  | "testimony";

type PublicRequestRow = {
  id: string;
  name: string | null;
  status: string | null;
  created_at: string | null;
};

type RecentRequest =
  PublicRequestRow & {
    type: PublicRequestType;
  };

function firstItem<T>(
  value:
    | T
    | T[]
    | null
    | undefined
): T | null {
  if (!value) return null;

  return Array.isArray(value)
    ? value[0] ?? null
    : value;
}

function formatDate(
  value?: string | null
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

function getStartOfMonthDate() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);
}

function getStartOfWeekIso() {
  const now = new Date();
  const day = now.getDay();

  const diff =
    now.getDate() -
    day +
    (day === 0 ? -6 : 1);

  const monday = new Date(
    now.setDate(diff)
  );

  monday.setHours(0, 0, 0, 0);

  return monday.toISOString();
}

function getRequestLabel(
  type: PublicRequestType
) {
  if (type === "prayer") {
    return "Demande de prière";
  }

  if (type === "appointment") {
    return "Rendez-vous pastoral";
  }

  if (type === "join") {
    return "Rejoindre l’église";
  }

  if (type === "testimony") {
    return "Témoignage";
  }

  return "Demande";
}

function getRequestIcon(
  type: PublicRequestType
) {
  if (type === "prayer") {
    return HeartHandshake;
  }

  if (type === "appointment") {
    return CalendarDays;
  }

  if (type === "join") {
    return UserPlus;
  }

  if (type === "testimony") {
    return Sparkles;
  }

  return MessageSquare;
}

function getStatusClass(
  status?: string | null
) {
  if (status === "nouvelle") {
    return "bg-purple-50 text-purple-700";
  }

  if (status === "en_cours") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "traitee") {
    return "bg-green-50 text-green-700";
  }

  if (status === "archivee") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
}

function getFirstName(
  fullName?: string | null
) {
  const value = String(
    fullName || ""
  ).trim();

  if (!value) return "";

  return (
    value.split(/\s+/)[0] || ""
  );
}

export default async function DashboardPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          role,
          church_id,
          status,
          churches(
            id,
            name,
            public_name,
            slug,
            logo_url,
            dashboard_welcome_message
          )
        `
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.status &&
    profile.status !== "active"
  ) {
    redirect("/login");
  }

  if (
    profile.role === "super_admin"
  ) {
    redirect(
      "/super-admin/dashboard"
    );
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const church =
    firstItem<DashboardChurch>(
      profile.churches
    );

  const churchId =
    profile.church_id;

  const startOfMonth =
    getStartOfMonthDate();

  const startOfWeek =
    getStartOfWeekIso();

  const [
    { count: activeMembersCount },
    { count: attendanceMonthCount },
    { count: soulFollowupsCount },
    { count: departmentsCount },
    { count: appointmentsWeekCount },
    { count: pendingPrayerCount },
    {
      count:
        pendingAppointmentCount,
    },
    { count: pendingJoinCount },
    {
      count:
        pendingTestimonyCount,
    },
    { data: prayerRequestsData },
    { data: appointmentsData },
    { data: joinRequestsData },
    { data: testimoniesData },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "active"),

    supabase
      .from("attendances")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .gte(
        "attendance_date",
        startOfMonth
      ),

    supabase
      .from("soul_followups")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      ),

    supabase
      .from("departments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "active"),

    supabase
      .from("appointments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .gte(
        "created_at",
        startOfWeek
      ),

    supabase
      .from("prayer_requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "nouvelle"),

    supabase
      .from("appointments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "nouvelle"),

    supabase
      .from("join_requests")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "nouvelle"),

    supabase
      .from("testimonies")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "nouvelle"),

    supabase
      .from("prayer_requests")
      .select(
        "id, name, status, created_at"
      )
      .eq(
        "church_id",
        churchId
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("appointments")
      .select(
        "id, name, status, created_at"
      )
      .eq(
        "church_id",
        churchId
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("join_requests")
      .select(
        "id, name, status, created_at"
      )
      .eq(
        "church_id",
        churchId
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("testimonies")
      .select(
        "id, name, status, created_at"
      )
      .eq(
        "church_id",
        churchId
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  const prayerRequests =
    (prayerRequestsData ??
      []) as PublicRequestRow[];

  const appointments =
    (appointmentsData ??
      []) as PublicRequestRow[];

  const joinRequests =
    (joinRequestsData ??
      []) as PublicRequestRow[];

  const testimonies =
    (testimoniesData ??
      []) as PublicRequestRow[];

  const recentRequests: RecentRequest[] =
    [
      ...prayerRequests.map(
        (item) => ({
          ...item,
          type: "prayer" as const,
        })
      ),

      ...appointments.map(
        (item) => ({
          ...item,
          type:
            "appointment" as const,
        })
      ),

      ...joinRequests.map(
        (item) => ({
          ...item,
          type: "join" as const,
        })
      ),

      ...testimonies.map(
        (item) => ({
          ...item,
          type:
            "testimony" as const,
        })
      ),
    ]
      .sort(
        (a, b) =>
          new Date(
            b.created_at ?? 0
          ).getTime() -
          new Date(
            a.created_at ?? 0
          ).getTime()
      )
      .slice(0, 6);

  const pendingRequestsCount =
    (pendingPrayerCount ?? 0) +
    (pendingAppointmentCount ?? 0) +
    (pendingJoinCount ?? 0) +
    (pendingTestimonyCount ?? 0);

  const churchName =
    church?.public_name?.trim() ||
    church?.name?.trim() ||
    "Votre église";

  const firstName = getFirstName(
    profile.full_name
  );

  const welcomeMessage =
    church?.dashboard_welcome_message?.trim() ||
    "Suivez les membres, les présences, les demandes publiques et le suivi pastoral de votre communauté.";

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--church-primary)] via-[var(--church-secondary)] to-[var(--church-accent)] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex min-w-0 items-start gap-4">
              {church?.logo_url && (
                <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-sm sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      church.logo_url
                    }
                    alt={`Logo ${churchName}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
                  Tableau de bord église
                </p>

                <h1 className="mt-3 break-words text-3xl font-extrabold">
                  {firstName
                    ? `Bonjour ${firstName}`
                    : churchName}
                </h1>

                {firstName && (
                  <p className="mt-1 break-words text-sm font-bold text-white/80">
                    {churchName}
                  </p>
                )}

                <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-7 text-white/90">
                  {welcomeMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {church?.slug && (
                <Link
                  href={`/church/${church.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[var(--church-primary)] shadow-sm transition hover:bg-white/90"
                >
                  Page publique
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <Link
                href="/public-requests"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                Demandes publiques
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Membres actifs"
            value={
              activeMembersCount ??
              0
            }
            description="Dans cette église"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Présences ce mois"
            value={
              attendanceMonthCount ??
              0
            }
            description="Pointages enregistrés"
            icon={CalendarCheck}
            accent="green"
          />

          <MetricCard
            title="Âmes suivies"
            value={
              soulFollowupsCount ??
              0
            }
            description="Suivi pastoral"
            icon={
              HeartHandshake
            }
            accent="purple"
          />

          <MetricCard
            title="Départements"
            value={
              departmentsCount ?? 0
            }
            description="Actifs"
            icon={Building2}
            accent="blue"
          />

          <MetricCard
            title="Rendez-vous"
            value={
              appointmentsWeekCount ??
              0
            }
            description="Cette semaine"
            icon={CalendarDays}
            accent="blue"
          />
        </section>

        <RoleDashboardPanel />

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--church-primary)]">
                  Demandes publiques récentes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Demandes envoyées depuis la page publique de cette église.
                </p>
              </div>

              <Link
                href="/public-requests"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--church-secondary)]"
              >
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentRequests.length ===
                0 && (
                <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-8 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-[var(--church-secondary)]" />

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Aucune demande publique pour le moment.
                  </p>
                </div>
              )}

              {recentRequests.map(
                (request) => {
                  const Icon =
                    getRequestIcon(
                      request.type
                    );

                  return (
                    <div
                      key={`${request.type}-${request.id}`}
                      className="flex flex-col gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[var(--church-primary)]">
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-extrabold text-[var(--church-primary)]">
                            {request.name ||
                              "Visiteur"}
                          </p>

                          <p className="text-sm text-slate-500">
                            {getRequestLabel(
                              request.type
                            )}{" "}
                            —{" "}
                            {formatDate(
                              request.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={[
                          "w-fit rounded-full px-3 py-1 text-xs font-bold",
                          getStatusClass(
                            request.status
                          ),
                        ].join(" ")}
                      >
                        {request.status ||
                          "nouvelle"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[var(--church-primary)]">
                <Bell className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[var(--church-primary)]">
                  Alertes pastorales
                </h2>

                <p className="text-sm text-slate-500">
                  Points à suivre aujourd’hui.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <AlertCard
                title={`${pendingRequestsCount} demande(s) en attente`}
                description="Demandes publiques à traiter par l’équipe de l’église."
                variant="purple"
              />

              <AlertCard
                title={`${soulFollowupsCount ?? 0} âme(s) suivie(s)`}
                description="Suivis pastoraux enregistrés dans cette église."
                variant="blue"
              />

              <AlertCard
                title={`${appointmentsWeekCount ?? 0} rendez-vous cette semaine`}
                description="Rendez-vous pastoraux créés cette semaine."
                variant="orange"
              />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AlertCard({
  title,
  description,
  variant,
}: {
  title: string;
  description: string;
  variant:
    | "purple"
    | "blue"
    | "orange";
}) {
  const className = {
    purple:
      "bg-purple-50 text-purple-700",
    blue:
      "bg-blue-50 text-blue-700",
    orange:
      "bg-orange-50 text-orange-700",
  }[variant];

  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
    >
      <p className="font-extrabold">
        {title}
      </p>

      <p className="mt-1 text-sm opacity-80">
        {description}
      </p>
    </div>
  );
}