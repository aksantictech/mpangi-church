import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditEventInput = {
  churchId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  category?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  status?: "success" | "denied" | "error" | "warning";
  severity?: "low" | "medium" | "high" | "critical";
  route?: string | null;
  metadata?: Record<string, unknown>;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

const SENSITIVE_KEYS = /password|token|secret|cookie|authorization|key/i;

function sanitize(value: Record<string, unknown> | null | undefined) {
  if (!value) return value ?? null;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEYS.test(key))
      .map(([key, item]) => [key, typeof item === "string" ? item.slice(0, 1000) : item])
  );
}

export async function logAuditEvent(input: AuditEventInput) {
  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");

    await createAdminClient().from("security_audit_logs").insert({
      church_id: input.churchId ?? null,
      actor_user_id: input.actorUserId ?? null,
      actor_email: input.actorEmail ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      event_category: input.category ?? null,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      status: input.status ?? "success",
      severity: input.severity ?? "low",
      route: input.route ?? null,
      ip_address: ipAddress,
      user_agent: requestHeaders.get("user-agent"),
      metadata: sanitize(input.metadata) ?? {},
      old_values: sanitize(input.oldValues),
      new_values: sanitize(input.newValues),
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}

