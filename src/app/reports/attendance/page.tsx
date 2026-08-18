import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarCheck, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    month?: string;
    department?: string;
  }>;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`)
  );
}

export default async function AttendanceReportPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const selectedMonth = /^\d{4}-\d{2}$/.test(params.month || "")
    ? String(params.month)
    : currentMonth();
  const { startDate, endDate } = monthRange(selectedMonth);

  const { admin, profile } = await requireChurchModuleAccess("attendance");
  const role = normalizeRoleCode(profile.role);

  let allowedDepartmentIds: string[] | null = null;
  if (role === "responsable_d") {
    allowedDepartmentIds = await getProfileDepartmentIds({
      profileId: profile.id,
      churchId: profile.church_id,
      email: profile.email || undefined,
    });
  }

  let departmentQuery = admin
    .from("departments")
    .select("id,name")
    .eq("church_id", profile.church_id)
    .eq("status", "active")
    .order("name");

  if (allowedDepartmentIds) {
    departmentQuery = departmentQuery.in(
      "id",
      allowedDepartmentIds.length
        ? allowedDepartmentIds
        : ["00000000-0000-0000-0000-000000000000"]
    );
  }

  const { data: departments } = await departmentQuery;
  const departmentRows = departments ?? [];
  const requestedDepartment = params.department || "";
  const selectedDepartment = departmentRows.some(
    (item: any) => item.id === requestedDepartment
  )
    ? requestedDepartment
    : allowedDepartmentIds?.length === 1
      ? allowedDepartmentIds[0]
      : "";

  const { data: activeMembers } = await admin
    .from("members")
    .select("id")
    .eq("church_id", profile.church_id)
    .eq("status", "actif")
    .is("archived_at", null);

  const allActiveIds = new Set((activeMembers ?? []).map((row: any) => row.id));
  let eligibleIds = new Set(allActiveIds);

  if (selectedDepartment) {
    const { data: assignments } = await admin
      .from("member_departments")
      .select("member_id")
      .eq("church_id", profile.church_id)
      .eq("department_id", selectedDepartment)
      .eq("status", "active");
    eligibleIds = new Set(
      (assignments ?? [])
        .map((row: any) => row.member_id)
        .filter((id: string) => allActiveIds.has(id))
    );
  }

  const { data: events } = await admin
    .from("events")
    .select("id,title,event_date,status,location")
    .eq("church_id", profile.church_id)
    .gte("event_date", startDate)
    .lt("event_date", endDate)
    .order("event_date", { ascending: true });

  const eventIds = (events ?? []).map((row: any) => row.id);
  const { data: attendances } = eventIds.length
    ? await admin
        .from("event_attendances")
        .select("event_id,member_id,created_at")
        .eq("church_id", profile.church_id)
        .in("event_id", eventIds)
    : { data: [] as any[] };

  const filteredAttendances = (attendances ?? []).filter((row: any) =>
    eligibleIds.has(row.member_id)
  );

  const eventRows = (events ?? []).map((event: any) => {
    const present = new Set(
      filteredAttendances
        .filter((row: any) => row.event_id === event.id)
        .map((row: any) => row.member_id)
    ).size;
    const eligible = eligibleIds.size;
    return {
      ...event,
      present,
      eligible,
      rate: eligible ? Math.round((present / eligible) * 100) : 0,
    };
  });

  const totalUniquePresence = new Set(
    filteredAttendances.map((row: any) => `${row.event_id}:${row.member_id}`)
  ).size;
  const expected = eligibleIds.size * eventRows.length;
  const overallRate = expected
    ? Math.round((totalUniquePresence / expected) * 100)
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
          <ArrowLeft className="h-4 w-4" /> Retour au centre de rapports
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Présences</p>
          <h1 className="mt-3 text-3xl font-black">Rapports de présence</h1>
          <p className="mt-2 text-sm text-blue-50">
            Analysez les présences par mois et par département.
          </p>
        </section>

        <form className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm md:grid-cols-[220px_1fr_auto] md:items-end">
          <label className="text-sm font-black text-[#03357A]">
            Mois
            <input type="month" name="month" defaultValue={selectedMonth} className="filter-input mt-2 w-full" />
          </label>
          <label className="text-sm font-black text-[#03357A]">
            Département
            <select name="department" defaultValue={selectedDepartment} className="filter-input mt-2 w-full">
              {!allowedDepartmentIds && <option value="">Tous les départements</option>}
              {departmentRows.map((item: any) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <button className="min-h-12 rounded-2xl bg-[#03357A] px-6 text-sm font-black text-white">Afficher</button>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric icon={Users} label="Membres éligibles" value={eligibleIds.size} />
          <Metric icon={CalendarCheck} label="Événements du mois" value={eventRows.length} />
          <Metric icon={BarChart3} label="Taux de présence" value={`${overallRate}%`} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-black text-[#03357A]">Détail par événement</h2>
            <p className="mt-1 text-sm text-slate-500">
              Période : {formatDate(startDate)} — {formatDate(new Date(new Date(endDate).getTime() - 86400000).toISOString().slice(0, 10))}
            </p>
          </div>

          {eventRows.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Aucun événement pour cette période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#F8FBFD] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Événement</th>
                    <th className="px-4 py-3">Présents</th>
                    <th className="px-4 py-3">Éligibles</th>
                    <th className="px-4 py-3">Taux</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCEAF5]">
                  {eventRows.map((row: any) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4">{formatDate(row.event_date)}</td>
                      <td className="px-4 py-4 font-black text-[#03357A]">{row.title || "Événement"}</td>
                      <td className="px-4 py-4">{row.present}</td>
                      <td className="px-4 py-4">{row.eligible}</td>
                      <td className="px-4 py-4 font-black">{row.rate}%</td>
                      <td className="px-4 py-4">
                        <Link href={`/attendance/reports/${row.id}`} className="rounded-xl bg-[#EAF3FA] px-3 py-2 text-xs font-black text-[#03357A]">
                          Voir le rapport
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-[#2563EB]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
    </div>
  );
}
