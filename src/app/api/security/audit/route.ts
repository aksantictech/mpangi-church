import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

const ADMIN_ROLES = new Set([
  "super_admin","church_admin","admin_eglise","pasteur_t","pastor",
]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getCurrentSecurityContext();

  if (!ADMIN_ROLES.has(context.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const severity = request.nextUrl.searchParams.get("severity");
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") || 100);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 500)) : 100;

  const admin = createAdminClient();

  let query = admin
    .from("security_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (context.role !== "super_admin" && context.churchId) {
    query = query.eq("church_id", context.churchId);
  }

  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
