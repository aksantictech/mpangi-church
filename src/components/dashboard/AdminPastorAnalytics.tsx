import { createAdminClient } from "@/lib/supabase/admin";
import AdminPastorCharts, { type DashboardChartPoint } from "./AdminPastorCharts";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
    new Date(year, month - 1, 1)
  );
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return monthKey(date);
  });
}

function rate(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function isProcessed(status: unknown) {
  return [
    "traitee",
    "traite",
    "treated",
    "completed",
    "closed",
    "archivee",
    "archived",
    "approved",
    "done",
  ].includes(String(status || "").toLowerCase());
}

export default async function AdminPastorAnalytics({ churchId }: { churchId: string }) {
  const admin = createAdminClient();
  const months = lastSixMonths();
  const firstMonth = `${months[0]}-01`;

  const [
    departmentsResult,
    membersResult,
    assignmentsResult,
    reportsResult,
    soulsResult,
    prayerResult,
    joinResult,
    testimoniesResult,
    appointmentsResult,
  ] = await Promise.all([
    admin.from("departments").select("id,name,status").eq("church_id", churchId).eq("status", "active"),
    admin.from("members").select("id,status").eq("church_id", churchId).is("archived_at", null),
    admin.from("member_departments").select("member_id,department_id,status").eq("church_id", churchId).eq("status", "active"),
    admin.from("department_monthly_reports").select("department_id,report_month,status,sent_at").eq("church_id", churchId).gte("report_month", firstMonth).eq("status", "submitted"),
    admin.from("soul_followups").select("id,created_at").eq("church_id", churchId).gte("created_at", `${firstMonth}T00:00:00`),
    admin.from("prayer_requests").select("id,status").eq("church_id", churchId),
    admin.from("join_requests").select("id,status").eq("church_id", churchId),
    admin.from("testimonies").select("id,status").eq("church_id", churchId),
    admin.from("appointments").select("id,status").eq("church_id", churchId),
  ]);

  const departments = departmentsResult.data ?? [];
  const allMemberIds = new Set((membersResult.data ?? []).map((row: any) => row.id));
  const departmentName = new Map(departments.map((row: any) => [row.id, row.name || "Département"]));

  const counts = new Map<string, number>();
  const assignedMemberIds = new Set<string>();
  for (const assignment of assignmentsResult.data ?? []) {
    if (!allMemberIds.has(assignment.member_id)) continue;
    const name = departmentName.get(assignment.department_id);
    if (!name) continue;
    assignedMemberIds.add(assignment.member_id);
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const unassigned = allMemberIds.size - assignedMemberIds.size;
  if (unassigned > 0) counts.set("Non affectés", unassigned);

  const departmentMembers: DashboardChartPoint[] = Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const activeDepartmentCount = departments.length;
  const reportRows = reportsResult.data ?? [];
  const reportEvolution = months.map((key) => {
    const submittedDepartments = new Set(
      reportRows
        .filter((row: any) => String(row.report_month || "").slice(0, 7) === key)
        .map((row: any) => row.department_id)
    );
    return {
      label: monthLabel(key),
      value: rate(submittedDepartments.size, activeDepartmentCount),
    };
  });

  const soulRows = soulsResult.data ?? [];
  const soulEvolution = months.map((key) => ({
    label: monthLabel(key),
    value: soulRows.filter((row: any) => String(row.created_at || "").slice(0, 7) === key).length,
  }));

  const publicRows = [
    ...(prayerResult.data ?? []),
    ...(joinResult.data ?? []),
    ...(testimoniesResult.data ?? []),
  ];
  const appointmentRows = appointmentsResult.data ?? [];

  return (
    <AdminPastorCharts
      departmentMembers={departmentMembers}
      reportEvolution={reportEvolution}
      soulEvolution={soulEvolution}
      publicRequestRate={rate(publicRows.filter((row: any) => isProcessed(row.status)).length, publicRows.length)}
      appointmentRate={rate(appointmentRows.filter((row: any) => isProcessed(row.status)).length, appointmentRows.length)}
    />
  );
}
