import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  ChevronRight,
  QrCode,
  ScanLine,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getEventTitle(event: any) {
  return event.title || event.name || event.event_name || "Événement";
}

function getEventDate(event: any) {
  const value =
    event.start_at ||
    event.starts_at ||
    event.start_date ||
    event.event_date ||
    event.created_at;

  if (!value) return "Date non renseignée";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export default async function AttendanceScannerEventsPage() {
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

  if (!profile || !profile.church_id) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: events } = await admin
    .from("events")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <ScanLine className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Présences QR
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Choisir un événement à pointer
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                Sélectionnez le culte, la formation ou l’événement pour ouvrir
                le scanner de présence.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Événements disponibles
          </h2>

          <div className="mt-5 space-y-3">
            {(events ?? []).length === 0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <CalendarCheck className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-extrabold text-[#03357A]">
                  Aucun événement disponible.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Créez d’abord un événement avant d’ouvrir le scanner.
                </p>

                <Link
                  href="/events"
                  className="mt-5 inline-flex rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
                >
                  Aller aux événements
                </Link>
              </div>
            ) : (
              (events ?? []).map((event: any) => (
                <Link
                  key={event.id}
                  href={`/attendance/scanner/${event.id}`}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 transition hover:bg-[#EAF3FA]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#03357A]">
                      <QrCode className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#03357A]">
                        {getEventTitle(event)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {getEventDate(event)}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
