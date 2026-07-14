import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SecurityAuditInput = {
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  status?: "success" | "denied" | "error" | "warning";
  severity?: "low" | "medium" | "high" | "critical";
  route?: string | null;
  metadata?: Record<string, unknown>;
  churchId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
};

async function resolveActor() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { userId: null, email: null, role: null, churchId: null };
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id,email,role,church_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      email: profile?.email || user.email || null,
      role: profile?.role ? String(profile.role) : null,
      churchId: profile?.church_id || null,
    };
  } catch {
    return { userId: null, email: null, role: null, churchId: null };
  }
}

async function resolveRequest() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for") || "";

    return {
      ip: forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || null,
      userAgent: h.get("user-agent") || null,
      route: h.get("x-pathname") || h.get("x-invoke-path") || null,
    };
  } catch {
    return { ip: null, userAgent: null, route: null };
  }
}

export async function recordSecurityEvent(input: SecurityAuditInput) {
  try {
    const [actor, request] = await Promise.all([
      resolveActor(),
      resolveRequest(),
    ]);

    const admin = createAdminClient();

    const { error } = await admin
      .from("security_audit_logs")
      .insert({
        church_id: input.churchId ?? actor.churchId,
        actor_user_id: input.actorUserId ?? actor.userId,
        actor_email: input.actorEmail ?? actor.email,
        actor_role: input.actorRole ?? actor.role,
        action: input.action,
        resource_type: input.resourceType || null,
        resource_id: input.resourceId || null,
        status: input.status || "success",
        severity: input.severity || "low",
        route: input.route ?? request.route,
        ip_address: request.ip,
        user_agent: request.userAgent,
        metadata: input.metadata || {},
      });

    if (error) {
      console.error("Journal sécurité non enregistré :", error.message);
    }
  } catch (error) {
    console.error("Échec silencieux du journal sécurité :", error);
  }
}

export async function withSecurityAudit<TResult>(
  input: Omit<SecurityAuditInput, "status" | "severity">,
  operation: () => Promise<TResult>
): Promise<TResult> {
  try {
    const result = await operation();

    await recordSecurityEvent({
      ...input,
      status: "success",
      severity: "low",
    });

    return result;
  } catch (error: any) {
    await recordSecurityEvent({
      ...input,
      status: "error",
      severity: "high",
      metadata: {
        ...(input.metadata || {}),
        error: error?.message || "Erreur non documentée",
      },
    });

    throw error;
  }
}
