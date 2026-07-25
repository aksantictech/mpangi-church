import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit/logAuditEvent";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = String(body.event || "");
  const allowed = new Set(["login.success", "login.failed", "logout"]);
  if (!allowed.has(event)) return NextResponse.json({ error: "Événement invalide." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: any = null;
  if (user) {
    const result = await supabase.from("profiles").select("user_id, email, role, church_id").eq("user_id", user.id).maybeSingle();
    profile = result.data;
  }

  await logAuditEvent({
    churchId: profile?.church_id || body.churchId || null,
    actorUserId: profile?.user_id || user?.id || null,
    actorEmail: profile?.email || user?.email || String(body.email || "").trim().toLowerCase() || null,
    actorRole: profile?.role || null,
    action: event,
    category: "authentication",
    status: event === "login.failed" ? "denied" : "success",
    severity: event === "login.failed" ? "medium" : "low",
    route: "/login",
    metadata: { reason: String(body.reason || "").slice(0, 250) || null },
  });
  return NextResponse.json({ ok: true });
}

