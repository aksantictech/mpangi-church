import { createAdminClient } from "@/lib/supabase/admin";

export type AuditFilters = {
  church?: string;
  action?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  q?: string;
};

export function applyAuditFilters(query: any, filters: AuditFilters) {
  let next = query;
  if (filters.church) next = next.eq("church_id", filters.church);
  if (filters.action) next = next.eq("action", filters.action);
  if (filters.status) next = next.eq("status", filters.status);
  if (filters.category) next = next.eq("event_category", filters.category);
  if (filters.from) next = next.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) next = next.lte("created_at", `${filters.to}T23:59:59.999`);
  if (filters.q) {
    const safe = filters.q.replace(/[%_,()]/g, " ").trim();
    if (safe) {
      next = next.or(
        `actor_email.ilike.%${safe}%,action.ilike.%${safe}%,resource_type.ilike.%${safe}%,route.ilike.%${safe}%`
      );
    }
  }
  return next;
}

export async function getAuditRows(filters: AuditFilters, limit = 5000) {
  const base = createAdminClient()
    .from("security_audit_logs")
    .select(
      "id, church_id, actor_user_id, actor_email, actor_role, action, event_category, resource_type, resource_id, status, severity, route, ip_address, user_agent, metadata, old_values, new_values, created_at, churches(name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } = await applyAuditFilters(base, filters);
  if (error) throw error;
  return data ?? [];
}

