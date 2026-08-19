import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRoleDashboardConfig } from "@/lib/dashboard/roleDashboard";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";

export const dynamic = "force-dynamic";

async function safeCount({
  table,
  churchId,
  churchColumn = "church_id",
  filters = [],
}: {
  table: string;
  churchId?: string | null;
  churchColumn?: string;
  filters?: Array<[string, string, any]>;
}) {
  try {
    const admin = createAdminClient();

    let query = admin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (churchId) {
      query = query.eq(churchColumn, churchId);
    }

    for (const [method, column, value] of filters) {
      if (method === "eq") query = query.eq(column, value);
      if (method === "gte") query = query.gte(column, value);
      if (method === "lte") query = query.lte(column, value);
      if (method === "lt") query = query.lt(column, value);
    }

    const { count, error } = await query;

    if (error) return 0;

    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id,user_id,full_name,email,role,church_id,status")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile };
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeMonth(value?: string | null) {
  if (/^\d{4}-\d{2}$/.test(value || "")) return value as string;
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string) {
  const start = `${month}-01`;
  const next = new Date(`${start}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);

  return {
    start,
    next: next.toISOString().slice(0, 10),
  };
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function isPromptDepartmentReport(report: any) {
  if (!report?.sent_at) return false;

  const end = report.period_end
    ? new Date(`${report.period_end}T23:59:59.999Z`)
    : (() => {
        const month = String(report.report_month || "").slice(0, 7);
        const date = new Date(`${month}-01T00:00:00Z`);
        date.setUTCMonth(date.getUTCMonth() + 1);
        date.setUTCDate(date.getUTCDate() - 1);
        date.setUTCHours(23, 59, 59, 999);
        return date;
      })();

  const deadline = new Date(end);
  deadline.setUTCDate(deadline.getUTCDate() + 7);

  return new Date(report.sent_at).getTime() <= deadline.getTime();
}

function mondayCountInMonth(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`);
  const year = first.getUTCFullYear();
  const monthIndex = first.getUTCMonth();
  let count = 0;
  const cursor = new Date(first);

  while (cursor.getUTCMonth() === monthIndex && cursor.getUTCFullYear() === year) {
    if (cursor.getUTCDay() === 1) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return Math.max(1, count);
}

async function getSecretaryKpis({
  churchId,
  month,
  departmentId,
}: {
  churchId: string;
  month: string;
  departmentId: string;
}) {
  const admin = createAdminClient();
  const range = monthRange(month);

  const [
    { data: departments },
    { data: correspondenceRows },
    { data: departmentReports },
    { data: extensions },
    { data: extensionActivities },
  ] = await Promise.all([
    admin
      .from("departments")
      .select("id,name")
      .eq("church_id", churchId)
      .eq("status", "active")
      .order("name"),
    admin
      .from("admin_correspondences")
      .select("id,status,correspondence_date")
      .eq("church_id", churchId)
      .gte("correspondence_date", range.start)
      .lt("correspondence_date", range.next)
      .limit(1000),
    admin
      .from("department_monthly_reports")
      .select("id,department_id,report_month,period_end,sent_at,status")
      .eq("church_id", churchId)
      .eq("status", "submitted")
      .eq("report_month", `${month}-01`)
      .limit(500),
    admin
      .from("church_extensions")
      .select("id,name,status")
      .eq("church_id", churchId)
      .eq("status", "active")
      .order("name"),
    admin
      .from("extension_weekly_activities")
      .select("extension_id,week_start,status")
      .eq("church_id", churchId)
      .gte("week_start", range.start)
      .lt("week_start", range.next)
      .neq("status", "archived")
      .limit(2000),
  ]);

  const departmentList = departments || [];
  const validDepartment = departmentList.some(
    (item: any) => item.id === departmentId
  )
    ? departmentId
    : "";

  const correspondence = correspondenceRows || [];
  const processedStatuses = new Set([
    "sent",
    "transmitted",
    "closed",
    "archived",
  ]);
  const processedFiles = correspondence.filter((item: any) =>
    processedStatuses.has(String(item.status || ""))
  ).length;

  const scopedDepartments = validDepartment
    ? departmentList.filter((item: any) => item.id === validDepartment)
    : departmentList;
  const scopedDepartmentReports = (departmentReports || []).filter(
    (item: any) => !validDepartment || item.department_id === validDepartment
  );
  const uniqueDepartmentReports = new Map(
    scopedDepartmentReports.map((item: any) => [item.department_id, item])
  );
  const receivedDepartmentReports = uniqueDepartmentReports.size;
  const expectedDepartmentReports = scopedDepartments.length;
  const promptDepartmentReports = Array.from(uniqueDepartmentReports.values()).filter(
    isPromptDepartmentReport
  ).length;

  const activeExtensions = extensions || [];
  const weeklyReportKeys = new Set(
    (extensionActivities || [])
      .filter((item: any) => item.extension_id && item.week_start)
      .map(
        (item: any) =>
          `${item.extension_id}:${String(item.week_start).slice(0, 10)}`
      )
  );
  const expectedExtensionReports =
    activeExtensions.length * mondayCountInMonth(month);
  const receivedExtensionReports = weeklyReportKeys.size;

  return {
    filters: {
      month,
      department: validDepartment,
      departments: departmentList,
    },
    stats: {
      totalFiles: correspondence.length,
      processedFiles,
      processedFilesPct: percent(processedFiles, correspondence.length),
      expectedDepartmentReports,
      receivedDepartmentReports,
      departmentReportsPct: percent(
        receivedDepartmentReports,
        expectedDepartmentReports
      ),
      promptDepartmentReports,
      departmentPromptitudePct: percent(
        promptDepartmentReports,
        receivedDepartmentReports
      ),
      expectedExtensionReports,
      receivedExtensionReports,
      extensionReportsPct: percent(
        receivedExtensionReports,
        expectedExtensionReports
      ),
    },
  };
}

async function getDepartmentResponsibleKpis({
  churchId,
  userId,
  profileId,
  email,
}: {
  churchId: string;
  userId: string;
  profileId: string;
  email?: string | null;
}) {
  const admin = createAdminClient();
  const departmentIds = await getProfileDepartmentIds({
    userId,
    churchId,
    email: email || undefined,
  });

  if (!departmentIds.length) {
    return {
      department_members: 0,
      department_attendance: 0,
      department_activities: 0,
      department_reports: 0,
      tasks: 0,
    };
  }

  const month = normalizeMonth(null);
  const range = monthRange(month);

  const [
    { data: assignments },
    { data: events },
    { count: reportsCount },
    { count: roleTasksCount },
    { count: adminTasksCount },
  ] = await Promise.all([
    admin
      .from("member_departments")
      .select("member_id,status,members(status)")
      .eq("church_id", churchId)
      .in("department_id", departmentIds),
    admin
      .from("events")
      .select("id,event_date")
      .eq("church_id", churchId)
      .gte("event_date", range.start)
      .lt("event_date", range.next),
    admin
      .from("department_monthly_reports")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .in("department_id", departmentIds)
      .eq("status", "submitted"),
    admin
      .from("church_user_role_tasks")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("assigned_to", userId)
      .not("status", "in", "(done,cancelled)"),
    admin
      .from("admin_tasks")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("assigned_to", profileId)
      .not("status", "in", "(completed,cancelled,archived)"),
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
    ...new Set(activeAssignments.map((item: any) => item.member_id).filter(Boolean)),
  ];
  const eventIds = (events || []).map((item: any) => item.id).filter(Boolean);

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
      (item: any) => `${item.event_id}:${item.member_id}`
    )
  );
  const representedActivities = new Set(
    (attendances || []).map((item: any) => item.event_id)
  );

  return {
    department_members: memberIds.length,
    department_attendance: uniqueAttendances.size,
    department_activities: representedActivities.size,
    department_reports: reportsCount ?? 0,
    tasks: Number(roleTasksCount || 0) + Number(adminTasksCount || 0),
  };
}

export async function GET(request: NextRequest) {
  const session = await getProfile();

  if (!session.user) {
    return NextResponse.json(
      { error: "Utilisateur non connecté." },
      { status: 401 }
    );
  }

  if (!session.profile) {
    return NextResponse.json(
      { error: "Profil utilisateur introuvable." },
      { status: 403 }
    );
  }

  if (session.profile.status && session.profile.status !== "active") {
    return NextResponse.json(
      { error: "Ce compte utilisateur est désactivé." },
      { status: 403 }
    );
  }

  const role = normalizeRoleCode(session.profile.role || "readonly");
  const churchId = session.profile.church_id;
  const config = getRoleDashboardConfig(role);

  const stats: Record<string, number> = {
    members: await safeCount({ table: "members", churchId }),
    attendanceThisMonth: await safeCount({
      table: "event_attendances",
      churchId,
      filters: [["gte", "created_at", firstDayOfMonth()]],
    }),
    souls: await safeCount({ table: "soul_followups", churchId }),
    publicRequests: await safeCount({ table: "public_requests", churchId }),
    pendingPublicRequests: await safeCount({
      table: "public_requests",
      churchId,
      filters: [["eq", "status", "pending"]],
    }),
    events: await safeCount({ table: "events", churchId }),
    departments: await safeCount({ table: "departments", churchId }),
    correspondence: await safeCount({
      table: "admin_correspondences",
      churchId,
    }),
    tasks: await safeCount({ table: "administrative_tasks", churchId }),
    extensionActivities: await safeCount({
      table: "extension_weekly_activities",
      churchId,
    }),
    extensions: await safeCount({ table: "church_extensions", churchId }),
    assets: await safeCount({ table: "patrimony_assets", churchId }),
    maintenances: await safeCount({
      table: "asset_maintenances",
      churchId,
    }),
    offeringsToday: await safeCount({
      table: "finance_offerings",
      churchId,
      filters: [["eq", "offering_date", todayIsoDate()]],
    }),
    expensesThisMonth: await safeCount({
      table: "finance_expenses",
      churchId,
      filters: [["gte", "expense_date", firstDayOfMonth().slice(0, 10)]],
    }),
  };

  let filters:
    | {
        month: string;
        department: string;
        departments: Array<{ id: string; name: string }>;
      }
    | undefined;

  if (role === "responsable_d" && churchId) {
    const departmentStats = await getDepartmentResponsibleKpis({
      churchId,
      userId: session.user.id,
      profileId: session.profile.id,
      email: session.profile.email,
    });
    Object.assign(stats, departmentStats);
  }

  if (role === "secretaire" && churchId) {
    const month = normalizeMonth(request.nextUrl.searchParams.get("month"));
    const departmentId = String(
      request.nextUrl.searchParams.get("department") || ""
    );
    const secretaryData = await getSecretaryKpis({
      churchId,
      month,
      departmentId,
    });

    Object.assign(stats, secretaryData.stats);
    filters = secretaryData.filters;
  }

  return NextResponse.json({
    profile: session.profile,
    config: {
      role: config.role,
      title: config.title,
      subtitle: config.subtitle,
      focus: config.focus,
      cards: (Array.isArray(config.cards) ? config.cards : []).map((card) => ({
        code: card.code,
        title: card.title,
        description: card.description,
        href: card.href,
        tone: card.tone,
      })),
    },
    stats,
    filters,
  });
}
