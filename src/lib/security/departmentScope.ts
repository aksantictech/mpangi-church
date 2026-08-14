import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const LEADER_ROLES = new Set([
  "leader",
  "responsable",
  "manager",
  "responsable_d",
  "department_leader",
]);

export async function getProfileDepartmentIds({
  profileId,
  userId,
  churchId,
  email,
}: {
  profileId?: string | null;
  userId?: string | null;
  churchId: string;
  email?: string | null;
}) {
  const admin = createAdminClient();
  let resolvedProfileId = profileId || null;
  if (!resolvedProfileId && userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("church_id", churchId)
      .eq("user_id", userId)
      .maybeSingle();
    resolvedProfileId = profile?.id || null;
  }
  if (!resolvedProfileId) return [];
  const { data: explicitAssignments } = await admin
    .from("profile_department_assignments")
    .select("department_id")
    .eq("church_id", churchId)
    .eq("profile_id", resolvedProfileId);

  if (explicitAssignments?.length) {
    return [...new Set(explicitAssignments.map((item) => item.department_id))];
  }

  // Compatibilité temporaire pour les anciens responsables liés uniquement à leur fiche membre.
  if (!email) return [];
  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .ilike("email", email)
    .maybeSingle();
  if (!member) return [];

  const { data: legacyAssignments } = await admin
    .from("member_departments")
    .select("department_id,role")
    .eq("church_id", churchId)
    .eq("member_id", member.id);

  return [
    ...new Set(
      (legacyAssignments || [])
        .filter((item) => LEADER_ROLES.has(String(item.role || "").toLowerCase()))
        .map((item) => item.department_id),
    ),
  ];
}

export async function profileCanAccessDepartment(input: {
  profileId?: string | null;
  userId?: string | null;
  churchId: string;
  departmentId: string;
  email?: string | null;
}) {
  const ids = await getProfileDepartmentIds(input);
  return ids.includes(input.departmentId);
}
