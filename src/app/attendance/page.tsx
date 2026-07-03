import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Eye,
  QrCode,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import AttendanceManualManager from "@/components/attendance/AttendanceManualManager";
import { createClient } from "@/lib/supabase/server";

type AttendancePageProps = {
  searchParams?: Promise<{
    event?: string | string[];
  }>;
};

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

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawEventId = resolvedSearchParams.event;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;

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

  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_date, start_time, location, status")
    .eq("church_id", churchId)
    .order("event_date", { ascending: false })
    .limit(30);

  let selectedEvent: any = null;

  if (eventId) {
    const { data: eventRaw } = await supabase
      .from("events")
      .select("id, church_id, title, event_date, start_time, location, status")
      .eq("id", eventId)
      .maybeSingle();

    if (!eventRaw) {
      notFound();
    }

    if (eventRaw.church_id !== churchId) {
      notFound();
    }

    selectedEvent = eventRaw;
  }

  const attendanceDate =
    selectedEvent?.event_date || new Date().toISOString().slice(0, 10);

  const [
    { count: membersCount },
    { count: presentCount },
    { data: members },
    { data: attendanceRecords },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "actif"),

    selectedEvent
      ? supabase
          .from("attendances")
          .select("*", { count: "exact", head: true })
          .eq("church_id", churchId)
          .eq("event_id", selectedEvent.id)
      : supabase
          .from("attendances")
          .select("*", { count: "exact", head: true })
          .eq("church_id", churchId)
          .eq("attendance_date", attendanceDate),

    supabase
      .from("members")
      .select(
        `
        id,
        first_name,
        middle_name,
        last_name,
        phone,
        photo_url,
        status
      `
      )
      .eq("church_id", churchId)
      .eq("status", "actif")
      .order("first_name", { ascending: true }),

    selectedEvent
      ? supabase
          .from("attendances")
          .select("id, member_id, status, check_in_time, method, created_at")
          .eq("church_id", churchId)
          .eq("event_id", selectedEvent.id)
          .order("created_at", { ascending: false })
      : supabase
          .from("attendances")
          .select("id, member_id, status, check_in_time, method, created_at")
          .eq("church_id", churchId)
          .eq("attendance_date", attendanceDate)
          .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Présences
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                {selectedEvent
                  ? selectedEvent.title || "Événement"
                  : "Choisir un événement"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                {selectedEvent
                  ? `Pointage du ${formatDate(selectedEvent.event_date)} à ${formatTime(
                      selectedEvent.start_time
                    )}.`
                  : "Sélectionnez un événement pour commencer le pointage des présences."}
              </p>
            </div>

            {selectedEvent && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/events/${selectedEvent.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                >
                  <Eye className="h-4 w-4" />
                  Voir événement
                </Link>

                <Link
                  href={`/attendance/scanner?event=${selectedEvent.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
                >
                  <QrCode className="h-4 w-4" />
                  Scanner QR
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Membres actifs"
            value={membersCount ?? 0}
            description="Éligibles au pointage"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Présents"
            value={presentCount ?? 0}
            description="Pointés pour cet événement"
            icon={CalendarCheck}
            accent="green"
          />

          <MetricCard
            title="Date"
            value={formatDate(attendanceDate)}
            description="Date du pointage"
            icon={CalendarDays}
            accent="purple"
          />
        </section>

        {!selectedEvent && (
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Sélectionner un événement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choisissez l’événement pour lequel vous voulez enregistrer les
              présences.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#C9DBEA] bg-[#F8FBFD] p-8 text-center md:col-span-2 xl:col-span-3">
                  <CalendarDays className="mx-auto h-10 w-10 text-[#3F79B3]" />

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Aucun événement disponible.
                  </p>
                </div>
              )}

              {events?.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/attendance?event=${event.id}`}
                  className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <h3 className="font-extrabold text-[#03357A]">
                    {event.title || "Événement sans titre"}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(event.event_date)} •{" "}
                    {formatTime(event.start_time)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {event.location || "Lieu non renseigné"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {selectedEvent && (
          <AttendanceManualManager
            churchId={churchId}
            profileId={profile.id}
            eventId={selectedEvent.id}
            attendanceDate={attendanceDate}
            members={(members ?? []) as any}
            records={(attendanceRecords ?? []) as any}
          />
        )}
      </div>
    </AppShell>
  );
}