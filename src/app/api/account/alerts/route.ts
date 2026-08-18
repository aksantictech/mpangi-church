import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ alerts: [], count: 0 }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, church_id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.church_id || (profile.status && profile.status !== "active")) {
    return NextResponse.json({ alerts: [], count: 0 });
  }

  const admin = createAdminClient();

  const [
    { count: pendingMembers },
    { count: roleTasks },
    { count: adminTasks },
    { count: unreadReports },
    correspondenceNotificationsResult,
  ] = await Promise.all([
    admin
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("status", "en_attente"),

    admin
      .from("church_user_role_tasks")
      .select("id", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("assigned_to", user.id)
      .not("status", "in", "(done,cancelled)"),

    admin
      .from("admin_tasks")
      .select("id", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("assigned_to", profile.id)
      .not("status", "in", "(completed,cancelled,archived)"),

    admin
      .from("department_report_recipients")
      .select("report_id", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("profile_id", profile.id)
      .is("read_at", null),

    admin
      .from("admin_correspondence_notifications")
      .select("id,title,body,priority,correspondence_id,created_at", {
        count: "exact",
      })
      .eq("church_id", profile.church_id)
      .eq("profile_id", profile.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const correspondenceRows = correspondenceNotificationsResult.data ?? [];
  const correspondenceCount = correspondenceNotificationsResult.count ?? 0;

  const alerts = [
    ...correspondenceRows.map((item: any) => ({
      id: `correspondence-${item.id}`,
      title: item.title,
      description: item.body || null,
      href: `/administration/correspondence/${item.correspondence_id}`,
      type: "correspondence",
      priority: item.priority || "normal",
    })),

    ...(pendingMembers
      ? [
          {
            id: "pending-members",
            title: `${pendingMembers} inscription(s) à valider`,
            href: "/members?status=en_attente",
            type: "validation",
            priority: "normal",
          },
        ]
      : []),

    ...(Number(roleTasks || 0) + Number(adminTasks || 0) > 0
      ? [
          {
            id: "open-tasks",
            title: `${Number(roleTasks || 0) + Number(adminTasks || 0)} tâche(s) non terminée(s)`,
            href: "/my-work",
            type: "task",
            priority: "normal",
          },
        ]
      : []),

    ...(unreadReports
      ? [
          {
            id: "department-reports",
            title: `${unreadReports} nouveau(x) rapport(s) de département`,
            href: "/reports/departments?received=1",
            type: "report",
            priority: "normal",
          },
        ]
      : []),
  ];

  return NextResponse.json({
    alerts,
    count:
      Number(pendingMembers || 0) +
      Number(roleTasks || 0) +
      Number(adminTasks || 0) +
      Number(unreadReports || 0) +
      correspondenceCount,
  });
}
