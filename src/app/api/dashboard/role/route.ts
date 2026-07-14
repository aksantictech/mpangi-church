import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRoleDashboardConfig } from "@/lib/dashboard/roleDashboard";

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
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, role, church_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile,
  };
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getProfile();

  if (!session?.profile) {
    return NextResponse.json(
      { error: "Utilisateur non connecté." },
      { status: 401 }
    );
  }

  const role = session.profile.role || "readonly";
  const churchId = session.profile.church_id;
  const config = getRoleDashboardConfig(role);

  const stats = {
    members: await safeCount({
      table: "members",
      churchId,
    }),
    attendanceThisMonth: await safeCount({
      table: "event_attendances",
      churchId,
      filters: [["gte", "created_at", firstDayOfMonth()]],
    }),
    souls: await safeCount({
      table: "soul_followups",
      churchId,
    }),
    publicRequests: await safeCount({
      table: "public_requests",
      churchId,
    }),
    pendingPublicRequests: await safeCount({
      table: "public_requests",
      churchId,
      filters: [["eq", "status", "pending"]],
    }),
    events: await safeCount({
      table: "events",
      churchId,
    }),
    departments: await safeCount({
      table: "departments",
      churchId,
    }),
    correspondence: await safeCount({
      table: "church_correspondences",
      churchId,
    }),
    tasks: await safeCount({
      table: "administrative_tasks",
      churchId,
    }),
    extensionActivities: await safeCount({
      table: "extension_weekly_activities",
      churchId,
    }),
    extensions: await safeCount({
      table: "church_extensions",
      churchId,
    }),
    assets: await safeCount({
      table: "patrimony_assets",
      churchId,
    }),
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
  });
}
