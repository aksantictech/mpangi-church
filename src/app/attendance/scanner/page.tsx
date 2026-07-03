import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Eye, QrCode, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import AttendanceQrScanner from "@/components/attendance/AttendanceQrScanner";
import { createClient } from "@/lib/supabase/server";

type AttendanceScannerPageProps = {
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

export default async function AttendanceScannerPage({
  searchParams,
}: AttendanceScannerPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawEventId = resolvedSearchParams.event;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;

  if (!eventId) {
    redirect("/attendance");
  }

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

  const { data: eventRaw } = await supabase
    .from("events")
    .select("id, church_id, title, event_date, start_time, location, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!eventRaw) {
    notFound();
  }

  const event = eventRaw as any;

  if (event.church_id !== churchId) {
    notFound();
  }

  const attendanceDate =
    event.event_date || new Date().toISOString().slice(0, 10);

  const [{ count: membersCount }, { count: presentCount }] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "actif"),

    supabase
      .from("attendances")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("event_id", event.id),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/attendance?event=${event.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au pointage manuel
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Scanner des présences
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                {event.title || "Événement"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Scannez les QR Codes des membres pour enregistrer les présences
                du {formatDate(event.event_date)} à{" "}
                {formatTime(event.start_time)}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/events/${event.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                <Eye className="h-4 w-4" />
                Voir événement
              </Link>

              <Link
                href={`/attendance?event=${event.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                Pointage manuel
              </Link>
            </div>
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
            description="Déjà pointés"
            icon={QrCode}
            accent="green"
          />

          <MetricCard
            title="Date"
            value={formatDate(attendanceDate)}
            description="Date de l’événement"
            icon={CalendarDays}
            accent="purple"
          />
        </section>

        <AttendanceQrScanner
          churchId={churchId}
          eventId={event.id}
          profileId={profile.id}
          attendanceDate={attendanceDate}
        />
      </div>
    </AppShell>
  );
}