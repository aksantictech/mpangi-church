import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EventActions from "@/components/events/EventActions";
import {
  ArrowLeft,
  CalendarDays,
  Church,
  Edit,
  MapPin,
  QrCode,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

type EventDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

function getStatusClass(status?: string | null) {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "completed") return "bg-blue-50 text-blue-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "draft") return "bg-slate-100 text-slate-600";

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
export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;

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

  const { data: eventRaw } = await supabase
    .from("events")
    .select(
      `
      *,
      churches(id, name, slug)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!eventRaw) {
    notFound();
  }

  const event = eventRaw as any;

  if (event.church_id !== profile.church_id) {
    notFound();
  }

  const church = firstItem<any>(event.churches);

  const eventTitle = event.title || event.name || "Événement sans titre";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                  <CalendarDays className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                    Fiche événement
                  </p>

                  <h1 className="mt-2 text-3xl font-extrabold">
                    {eventTitle}
                  </h1>

                  <p className="mt-2 text-sm text-blue-50">
                    {church?.name || "Église non renseignée"} •{" "}
                    {formatDate(event.event_date)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>

                <Link
                  href={`/attendance?event=${event.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
                >
                  <QrCode className="h-4 w-4" />
                  Présences
                </Link>
                <EventActions
  eventId={event.id}
  currentStatus={
    event.status || "active"
  }
/>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Date"
              value={formatDate(event.event_date)}
              icon={CalendarDays}
            />

            <InfoCard
              label="Heure début"
              value={formatTime(event.start_time)}
              icon={CalendarDays}
            />

            <InfoCard
              label="Heure fin"
              value={formatTime(event.end_time)}
              icon={CalendarDays}
            />

            <InfoCard
              label="Statut"
              value={getStatusLabel(event.status)}
              icon={Users}
              badgeClass={getStatusClass(event.status)}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Localisation
            </h2>

            <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-5">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#3F79B3]" />

                <p className="font-semibold text-slate-700">
                  {event.location || "Lieu non renseigné"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F8FBFD] p-5">
              <div className="flex items-center gap-3">
                <Church className="h-5 w-5 text-[#3F79B3]" />

                <p className="font-semibold text-slate-700">
                  {church?.name || "Église non renseignée"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Description
            </h2>

            <p className="mt-5 whitespace-pre-line rounded-2xl bg-[#F8FBFD] p-5 text-sm leading-7 text-slate-600">
              {event.description || "Aucune description enregistrée."}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  badgeClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#3F79B3]" />

        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      {badgeClass ? (
        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-3 font-semibold text-slate-700">{value}</p>
      )}
    </div>
  );
}