import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Eye,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "completed") return "bg-blue-50 text-blue-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "draft") return "bg-slate-100 text-slate-600";

  return "bg-slate-100 text-slate-600";
}

function getEventTitle(event: any) {
  return event.title || event.name || "Événement sans titre";
}

function getEventDate(event: any) {
  return event.event_date || event.date || event.start_date || event.created_at;
}

function getEventTime(event: any) {
  const start = event.start_time || event.time || "";
  const end = event.end_time || "";

  if (start && end) return `${start} - ${end}`;
  if (start) return start;

  return "-";
}

export default async function EventsPage() {
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

  const churchId = profile.church_id;
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalEventsCount },
    { count: upcomingEventsCount },
    { count: completedEventsCount },
    { data: events, error },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId),

    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .gte("event_date", today),

    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "completed"),

    supabase
      .from("events")
      .select("*")
      .eq("church_id", churchId)
      .order("event_date", { ascending: false }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Agenda de l’église
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">Événements</h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Gérez les cultes, réunions, formations, campagnes, conférences
                et activités de votre église.
              </p>
            </div>

            <Link
              href="/events/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-5 w-5" />
              Nouvel événement
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total événements"
            value={totalEventsCount ?? 0}
            description="Créés dans cette église"
            icon={CalendarDays}
            accent="blue"
          />

          <MetricCard
            title="À venir"
            value={upcomingEventsCount ?? 0}
            description="Événements planifiés"
            icon={CalendarCheck}
            accent="green"
          />

          <MetricCard
            title="Terminés"
            value={completedEventsCount ?? 0}
            description="Événements clôturés"
            icon={Users}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des événements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les événements affichés appartiennent uniquement à votre église.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher un événement..."
                className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Événement</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Heure</th>
                  <th className="px-4 py-3">Lieu</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-red-600">
                      Erreur : {error.message}
                    </td>
                  </tr>
                )}

                {!error && events?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun événement trouvé.
                    </td>
                  </tr>
                )}

                {events?.map((event: any) => {
                  const eventTitle = getEventTitle(event);

                  return (
                    <tr key={event.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-extrabold text-[#03357A]">
                            {eventTitle}
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {event.description || "Aucune description"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {formatDate(getEventDate(event))}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {getEventTime(event)}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#3F79B3]" />
                          {event.location || "Non renseigné"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            event.status
                          )}`}
                        >
                          {event.status || "active"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/events/${event.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}