import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Download,
  QrCode,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AttendanceReportPageProps = {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    q?: string;
    view?: string;
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

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function getMemberCode(member: any) {
  if (member.member_code) return member.member_code;
  return `M-${String(member.id).replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default async function AttendanceReportPage({
  params,
  searchParams,
}: AttendanceReportPageProps) {
  const { eventId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = (resolvedSearchParams.q || "").trim();
  const view = resolvedSearchParams.view || "all";

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
    .select("id, member_id, scanned_by, status, check_in_method, check_in_at")
    .eq("church_id", profile.church_id)
    .eq("event_id", eventId)
    .order("check_in_at", { ascending: false });

  const { data: members } = await admin
    .from("members")
    .select(
      `
      id,
      first_name,
      middle_name,
      last_name,
      phone,
      email,
      status,
      photo_url,
      member_code
      `
    )
    .eq("church_id", profile.church_id)
    .eq("status", "actif")
    .order("last_name", { ascending: true });

  const allMembers = members ?? [];
  const attendanceRows = attendances ?? [];
  const presentMemberIds = new Set(
    attendanceRows.map((attendance: any) => attendance.member_id)
  );

  const memberIds = allMembers.map((member: any) => member.id);

  const { data: memberDepartments } =
    memberIds.length > 0
      ? await admin
          .from("member_departments")
          .select("member_id, department_id")
          .eq("church_id", profile.church_id)
          .in("member_id", memberIds)
      : { data: [] as any[] };

  const departmentIds = Array.from(
    new Set(
      (memberDepartments ?? [])
        .map((row: any) => row.department_id)
        .filter(Boolean)
    )
  );

  const { data: departments } =
    departmentIds.length > 0
      ? await admin
          .from("departments")
          .select("id, name")
          .eq("church_id", profile.church_id)
          .in("id", departmentIds)
      : { data: [] as any[] };

  const departmentsById = new Map(
    (departments ?? []).map((department: any) => [department.id, department.name])
  );

  const departmentsByMemberId = new Map<string, string[]>();

  for (const row of memberDepartments ?? []) {
    const departmentName = departmentsById.get(row.department_id);

    if (!departmentName) continue;

    const existing = departmentsByMemberId.get(row.member_id) ?? [];
    existing.push(departmentName);
    departmentsByMemberId.set(row.member_id, existing);
  }

  const attendanceByMemberId = new Map(
    attendanceRows.map((attendance: any) => [attendance.member_id, attendance])
  );

  let reportRows = allMembers.map((member: any) => {
    const attendance = attendanceByMemberId.get(member.id) as any | undefined;
    const fullName = getMemberName(member) || "Nom non renseigné";

    return {
      member,
      fullName,
      memberCode: getMemberCode(member),
      departments:
        departmentsByMemberId.get(member.id)?.join(", ") || "Non renseigné",
      attendance,
      isPresent: Boolean(attendance),
    };
  });

  if (view === "present") {
    reportRows = reportRows.filter((row) => row.isPresent);
  }

  if (view === "absent") {
    reportRows = reportRows.filter((row) => !row.isPresent);
  }

  if (query) {
    const normalizedQuery = normalizeText(query);

    reportRows = reportRows.filter((row) => {
      const searchable = normalizeText(
        [
          row.fullName,
          row.memberCode,
          row.member.phone || "",
          row.member.email || "",
          row.departments,
        ].join(" ")
      );

      return searchable.includes(normalizedQuery);
    });
  }

  const presentCount = presentMemberIds.size;
  const activeCount = allMembers.length;
  const absentCount = Math.max(activeCount - presentCount, 0);
  const eventDate = formatDate(getEventDateValue(event));

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/attendance/scanner/${eventId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au scanner
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Rapport de présence
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                {getEventTitle(event)}
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                {eventDate} · Liste des présents, absents et export CSV.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/attendance/scanner/${eventId}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 hover:bg-white/20"
              >
                <QrCode className="h-4 w-4" />
                Scanner
              </Link>

              <Link
                href={`/api/attendance/export?eventId=${eventId}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Membres actifs"
            value={activeCount}
            icon={Users}
            href={`/attendance/reports/${eventId}`}
            active={view === "all"}
          />
          <StatCard
            label="Présents"
            value={presentCount}
            icon={UserCheck}
            href={`/attendance/reports/${eventId}?view=present`}
            active={view === "present"}
          />
          <StatCard
            label="Absents"
            value={absentCount}
            icon={UserX}
            href={`/attendance/reports/${eventId}?view=absent`}
            active={view === "absent"}
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="flex flex-col gap-3 md:flex-row" action={`/attendance/reports/${eventId}`}>
            <input type="hidden" name="view" value={view} />

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Rechercher par nom, téléphone, ID ou département..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
            >
              Rechercher
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Liste de présence
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {reportRows.length} résultat(s) affiché(s).
            </p>
          </div>

          {reportRows.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarCheck className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">
                Aucun résultat trouvé.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {reportRows.map((row) => (
                <div
                  key={row.member.id}
                  className="grid gap-4 p-5 lg:grid-cols-[1.3fr_1fr_0.9fr_0.8fr]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-sm font-extrabold text-[#03357A]">
                      {row.member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.member.photo_url}
                          alt={row.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        row.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <p className="font-extrabold text-[#03357A]">
                        {row.fullName}
                      </p>
                      <p className="text-xs font-bold text-slate-400">
                        {row.memberCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Département
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {row.departments}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Contact
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {row.member.phone || row.member.email || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-start lg:justify-end">
                    {row.isPresent ? (
                      <div className="text-left lg:text-right">
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                          Présent
                        </span>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {formatDate(row.attendance?.check_in_at)}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                        Absent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  active,
}: {
  label: string;
  value: number;
  icon: any;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-5 shadow-sm transition ${
        active
          ? "border-[#03357A] bg-[#03357A] text-white"
          : "border-[#DCEAF5] bg-white text-[#03357A] hover:bg-[#F8FBFD]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              active ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {label}
          </p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            active ? "bg-white/15" : "bg-[#EAF3FA]"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}
