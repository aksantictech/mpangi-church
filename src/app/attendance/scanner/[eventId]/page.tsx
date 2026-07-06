import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ScanLine, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import EventQrScannerClient from "@/components/attendance/EventQrScannerClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type EventScannerPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function getEventTitle(event: any) {
  return event.title || event.name || event.event_name || "Événement";
}

function getEventDateValue(event: any) {
  return (
    event.start_at ||
    event.starts_at ||
    event.start_date ||
    event.event_date ||
    event.created_at ||
    null
  );
}

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

export default async function EventScannerPage({
  params,
}: EventScannerPageProps) {
  const { eventId } = await params;

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

  const { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("church_id", profile.church_id)
    .maybeSingle();

  if (!event) {
    redirect("/attendance/scanner");
  }

  const { data: attendances } = await admin
    .from("event_attendances")
    .select("id, member_id, check_in_at, status")
    .eq("church_id", profile.church_id)
    .eq("event_id", eventId)
    .order("check_in_at", { ascending: false })
    .limit(12);

  const memberIds = Array.from(
    new Set((attendances ?? []).map((item: any) => item.member_id))
  );

  const { data: members } =
    memberIds.length > 0
      ? await admin
          .from("members")
          .select("id, first_name, last_name, phone, photo_url")
          .in("id", memberIds)
      : { data: [] as any[] };

  const membersById = new Map(
    (members ?? []).map((member: any) => [member.id, member])
  );

  const checkedCount = attendances?.length ?? 0;
  const eventDate = formatDate(getEventDateValue(event));

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/attendance/scanner"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                <ScanLine className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  Scanner présence
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  {getEventTitle(event)}
                </h1>

                <p className="mt-2 text-sm leading-7 text-blue-50">
                  {eventDate} · Scannez le QR Code personnel des membres
                  présents.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black">{checkedCount}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Pointages récents
              </p>
            </div>
          </div>
        </section>

        <EventQrScannerClient eventId={eventId} />

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Derniers pointages
              </h2>

              <p className="text-sm text-slate-500">
                Les derniers membres scannés pour cet événement.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(attendances ?? []).length === 0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-extrabold text-[#03357A]">
                  Aucun pointage pour le moment.
                </p>
              </div>
            ) : (
              (attendances ?? []).map((attendance: any) => {
                const member = membersById.get(attendance.member_id);
                const memberName = member
                  ? [member.first_name, member.last_name]
                      .filter(Boolean)
                      .join(" ")
                  : "Membre";

                return (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-sm font-extrabold text-[#03357A]">
                        {member?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photo_url}
                            alt={memberName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          memberName.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div>
                        <p className="font-extrabold text-[#03357A]">
                          {memberName}
                        </p>

                        <p className="text-sm text-slate-500">
                          {member?.phone || "Téléphone non renseigné"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                      {formatDate(attendance.check_in_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
