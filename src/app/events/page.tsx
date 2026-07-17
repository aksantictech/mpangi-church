import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Eye,
  Filter,
  MapPin,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

import MetricCard from "@/components/dashboard/MetricCard";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

type EventsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

type EventRow = {
  id: string;
  church_id: string;
  title: string | null;
  name?: string | null;
  description: string | null;
  event_date: string | null;
  date?: string | null;
  start_date?: string | null;
  created_at?: string | null;
  start_time: string | null;
  time?: string | null;
  end_time: string | null;
  location: string | null;
  status: string | null;
};

const ALLOWED_STATUS_FILTERS =
  new Set([
    "active",
    "draft",
    "completed",
    "cancelled",
  ]);

function cleanSearchValue(
  value?: string
) {
  return String(value || "")
    .trim()
    .slice(0, 100)
    .replace(
      /[,%()_*"'\\]/g,
      " "
    )
    .replace(/\s+/g, " ");
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
      year: "numeric",
    }
  ).format(new Date(value));
}

function formatTime(
  value?: string | null
) {
  if (!value) return "";

  return value.slice(0, 5);
}

function getStatusClass(
  status?: string | null
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  if (status === "completed") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "draft") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(
  status?: string | null
) {
  if (status === "active") {
    return "Actif";
  }

  if (status === "completed") {
    return "Terminé";
  }

  if (status === "cancelled") {
    return "Annulé";
  }

  if (status === "draft") {
    return "Brouillon";
  }

  return "Non défini";
}

function getEventTitle(
  event: EventRow
) {
  return (
    event.title ||
    event.name ||
    "Événement sans titre"
  );
}

function getEventDate(
  event: EventRow
) {
  return (
    event.event_date ||
    event.date ||
    event.start_date ||
    event.created_at ||
    null
  );
}

function getEventTime(
  event: EventRow
) {
  const start = formatTime(
    event.start_time ||
      event.time
  );

  const end = formatTime(
    event.end_time
  );

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  return "-";
}

export default async function EventsPage({
  searchParams,
}: EventsPageProps) {
  const supabase =
    await createClient();

  const params =
    (await searchParams) ?? {};

  const rawSearch = String(
    params.q || ""
  )
    .trim()
    .slice(0, 100);

  const searchValue =
    cleanSearchValue(rawSearch);

  const statusFilter =
    params.status &&
    ALLOWED_STATUS_FILTERS.has(
      params.status
    )
      ? params.status
      : "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "id, role, church_id, status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.status &&
    !["active", "actif"].includes(
      profile.status
    )
  ) {
    redirect("/login");
  }

  if (
    profile.role ===
    "super_admin"
  ) {
    redirect(
      "/super-admin/dashboard"
    );
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const churchId =
    profile.church_id;

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  let eventsQuery = supabase
    .from("events")
    .select("*")
    .eq(
      "church_id",
      churchId
    );

  if (searchValue) {
    const pattern =
      `%${searchValue}%`;

    eventsQuery = eventsQuery.or(
      [
        `title.ilike.${pattern}`,
        `description.ilike.${pattern}`,
        `location.ilike.${pattern}`,
      ].join(",")
    );
  }

  if (statusFilter) {
    eventsQuery =
      eventsQuery.eq(
        "status",
        statusFilter
      );
  }

  eventsQuery = eventsQuery.order(
    "event_date",
    {
      ascending: false,
    }
  );

  const [
    { count: totalEventsCount },
    { count: upcomingEventsCount },
    { count: completedEventsCount },
    { data: events, error },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      ),

    supabase
      .from("events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq("status", "active")
      .gte(
        "event_date",
        today
      ),

    supabase
      .from("events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "church_id",
        churchId
      )
      .eq(
        "status",
        "completed"
      ),

    eventsQuery,
  ]);

  const eventRows =
    (events ?? []) as EventRow[];

  const hasActiveFilters =
    Boolean(
      rawSearch ||
        statusFilter
    );

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Agenda de l’église
              </p>

              <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                Événements
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Gérez les cultes,
                réunions, formations,
                campagnes, conférences et
                activités de votre église.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/attendance/scanner"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20 sm:px-5"
              >
                <QrCode className="h-5 w-5" />
                Scanner QR
              </Link>

              <Link
                href="/events/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA] sm:px-5"
              >
                <Plus className="h-5 w-5" />
                Nouvel événement
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Total événements"
            value={
              totalEventsCount ?? 0
            }
            description="Créés dans cette église"
            icon={CalendarDays}
            accent="blue"
          />

          <MetricCard
            title="À venir"
            value={
              upcomingEventsCount ?? 0
            }
            description="Événements actifs planifiés"
            icon={CalendarCheck}
            accent="green"
          />

          <MetricCard
            title="Terminés"
            value={
              completedEventsCount ??
              0
            }
            description="Événements clôturés"
            icon={Users}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des événements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les événements affichés
                appartiennent uniquement à
                votre église.
              </p>
            </div>

            <form
              action="/events"
              method="get"
              className="flex w-full flex-col gap-2 xl:max-w-4xl xl:flex-row"
            >
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  name="q"
                  type="search"
                  defaultValue={rawSearch}
                  placeholder="Titre, lieu ou description..."
                  className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                />
              </label>

              <select
                name="status"
                defaultValue={
                  statusFilter
                }
                className="h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-[#03357A] outline-none focus:border-[#03357A] xl:w-48"
              >
                <option value="">
                  Tous les statuts
                </option>

                <option value="active">
                  Actifs
                </option>

                <option value="draft">
                  Brouillons
                </option>

                <option value="completed">
                  Terminés
                </option>

                <option value="cancelled">
                  Annulés
                </option>
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 text-sm font-bold text-white hover:bg-[#022B63]"
              >
                <Filter className="h-4 w-4" />
                Filtrer
              </button>

              {hasActiveFilters && (
                <Link
                  href="/events"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 text-sm font-bold text-[#03357A]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Link>
              )}
            </form>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-500">
              {eventRows.length} résultat(s)
              correspondant à votre
              recherche.
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">
                    Événement
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Heure
                  </th>

                  <th className="px-4 py-3">
                    Lieu
                  </th>

                  <th className="px-4 py-3">
                    Statut
                  </th>

                  <th className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-red-600"
                    >
                      Erreur :{" "}
                      {error.message}
                    </td>
                  </tr>
                )}

                {!error &&
                  eventRows.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        {hasActiveFilters
                          ? "Aucun événement ne correspond aux filtres."
                          : "Aucun événement trouvé."}
                      </td>
                    </tr>
                  )}

                {!error &&
                  eventRows.map(
                    (event) => {
                      const eventTitle =
                        getEventTitle(
                          event
                        );

                      return (
                        <tr
                          key={event.id}
                          className="hover:bg-[#F8FBFD]"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-extrabold text-[#03357A]">
                                {
                                  eventTitle
                                }
                              </p>

                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                {event.description ||
                                  "Aucune description"}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {formatDate(
                              getEventDate(
                                event
                              )
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {getEventTime(
                              event
                            )}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            <span className="inline-flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#3F79B3]" />

                              {event.location ||
                                "Non renseigné"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                event.status
                              )}`}
                            >
                              {getStatusLabel(
                                event.status
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/events/${event.id}`}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
                              >
                                <Eye className="h-4 w-4" />
                                Voir
                              </Link>

                              <Link
                                href={`/attendance/scanner/${event.id}`}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#03357A] px-4 py-2 text-sm font-bold text-white hover:bg-[#022B63]"
                              >
                                <QrCode className="h-4 w-4" />
                                Scanner
                              </Link>

                              <Link
                                href={`/attendance/reports/${event.id}`}
                                className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100"
                              >
                                <BarChart3 className="h-4 w-4" />
                                Rapport
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}