export type DepartmentActivitySummary = {
  activeMembers: number;
  leaders: number;
  activities: number;
  attendanceCount: number;
  expectedAttendances: number;
  attendanceRate: number;
  averageAttendance: number;
};

type SummaryInput = {
  admin: any;
  churchId: string;
  departmentId: string;
  periodStart: string;
  periodEnd: string;
};

function nextDay(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export async function getDepartmentActivitySummary({
  admin,
  churchId,
  departmentId,
  periodStart,
  periodEnd,
}: SummaryInput): Promise<DepartmentActivitySummary> {
  const until = nextDay(periodEnd);

  const [{ data: assignments }, { data: events }] = await Promise.all([
    admin
      .from("member_departments")
      .select("member_id,role,status,members(status)")
      .eq("church_id", churchId)
      .eq("department_id", departmentId),
    admin
      .from("events")
      .select("id,event_date")
      .eq("church_id", churchId)
      .gte("event_date", periodStart)
      .lt("event_date", until),
  ]);

  const activeAssignments = (assignments || []).filter((assignment: any) => {
    const member = Array.isArray(assignment.members)
      ? assignment.members[0]
      : assignment.members;

    return (
      assignment.status === "active" &&
      (!member?.status || ["active", "actif"].includes(member.status))
    );
  });

  const memberIds = [
    ...new Set(
      activeAssignments
        .map((assignment: any) => assignment.member_id)
        .filter(Boolean)
    ),
  ];

  const eventIds = (events || []).map((event: any) => event.id).filter(Boolean);

  const { data: attendances } =
    memberIds.length && eventIds.length
      ? await admin
          .from("event_attendances")
          .select("member_id,event_id")
          .eq("church_id", churchId)
          .in("member_id", memberIds)
          .in("event_id", eventIds)
      : { data: [] as any[] };

  const uniqueAttendances = new Set(
    (attendances || []).map(
      (attendance: any) => `${attendance.event_id}:${attendance.member_id}`
    )
  );

  const representedActivities = new Set(
    (attendances || []).map((attendance: any) => attendance.event_id)
  ).size;

  const leaders = new Set(
    activeAssignments
      .filter((assignment: any) =>
        [
          "star",
          "leader",
          "responsable",
          "manager",
          "responsable_d",
          "department_leader",
        ].includes(String(assignment.role || "").toLowerCase())
      )
      .map((assignment: any) => assignment.member_id)
  ).size;

  const activeMembers = memberIds.length;
  const attendanceCount = uniqueAttendances.size;
  const expectedAttendances = activeMembers * representedActivities;
  const attendanceRate = expectedAttendances
    ? Math.min(100, Math.round((attendanceCount / expectedAttendances) * 100))
    : 0;
  const averageAttendance = representedActivities
    ? Math.round(attendanceCount / representedActivities)
    : 0;

  return {
    activeMembers,
    leaders,
    activities: representedActivities,
    attendanceCount,
    expectedAttendances,
    attendanceRate,
    averageAttendance,
  };
}

export async function getDepartmentActivitySummaryForReport({
  admin,
  churchId,
  report,
}: {
  admin: any;
  churchId: string;
  report: {
    department_id: string;
    report_month?: string | null;
    period_start?: string | null;
    period_end?: string | null;
  };
}) {
  const month = String(report.report_month || new Date().toISOString()).slice(0, 7);
  const periodStart = report.period_start || `${month}-01`;

  let periodEnd = report.period_end || "";
  if (!periodEnd) {
    const end = new Date(`${month}-01T00:00:00Z`);
    end.setUTCMonth(end.getUTCMonth() + 1);
    end.setUTCDate(end.getUTCDate() - 1);
    periodEnd = end.toISOString().slice(0, 10);
  }

  return getDepartmentActivitySummary({
    admin,
    churchId,
    departmentId: report.department_id,
    periodStart,
    periodEnd,
  });
}
