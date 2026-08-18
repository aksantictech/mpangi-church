"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeUserRole } from "@/lib/users/userRoles";

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "admin_eglise",
  "owner",
  "pasteur",
  "pasteur_t",
  "pasteur_titulaire",
  "pastor",
  "pastor_titulaire",
]);

function boolFromForm(
  value: FormDataEntryValue | null
) {
  return value === "on" || value === "true";
}

async function getCurrentAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.status &&
    profile.status !== "active"
  ) {
    redirect("/login");
  }

  const role = String(
    profile.role || ""
  ).toLowerCase();

  if (role === "super_admin") {
    redirect("/super-admin/settings");
  }

  if (
    !profile.church_id ||
    !ADMIN_ROLES.has(role)
  ) {
    redirect("/dashboard");
  }

  return profile;
}

export async function saveProfileModulePermissionAction(
  formData: FormData
) {
  const adminProfile =
    await getCurrentAdminProfile();

  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  );

  const moduleCode = String(
    formData.get("module_code") || ""
  );

  if (!profileId || !moduleCode) {
    redirect("/settings/users");
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, church_id")
    .eq("id", profileId)
    .eq(
      "church_id",
      adminProfile.church_id
    )
    .maybeSingle();

  if (!targetProfile) {
    redirect("/settings/users");
  }

  const { error } = await admin
    .from("profile_module_permissions")
    .upsert(
      {
        church_id:
          adminProfile.church_id,
        profile_id: profileId,
        module_code: moduleCode,
        can_view: boolFromForm(
          formData.get("can_view")
        ),
        can_create: boolFromForm(
          formData.get("can_create")
        ),
        can_update: boolFromForm(
          formData.get("can_update")
        ),
        can_delete: boolFromForm(
          formData.get("can_delete")
        ),
        can_export: boolFromForm(
          formData.get("can_export")
        ),
        can_approve: boolFromForm(
          formData.get("can_approve")
        ),
        updated_by: adminProfile.id,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "church_id,profile_id,module_code",
      }
    );

  if (error) {
    redirect(
      `/settings/users?profileId=${profileId}&error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/settings/users");

  redirect(
    `/settings/users?profileId=${profileId}&saved=1`
  );
}

export async function clearProfileModulePermissionAction(
  formData: FormData
) {
  const adminProfile =
    await getCurrentAdminProfile();

  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  );

  const moduleCode = String(
    formData.get("module_code") || ""
  );

  if (!profileId || !moduleCode) {
    redirect("/settings/users");
  }

  const { error } = await admin
    .from("profile_module_permissions")
    .delete()
    .eq(
      "church_id",
      adminProfile.church_id
    )
    .eq("profile_id", profileId)
    .eq("module_code", moduleCode);

  if (error) {
    redirect(
      `/settings/users?profileId=${profileId}&error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/settings/users");

  redirect(
    `/settings/users?profileId=${profileId}&saved=1`
  );
}

function taskPeriodKey(frequency: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const date = String(now.getUTCDate()).padStart(2, "0");

  if (frequency === "daily") return `${year}-${month}-${date}`;
  if (frequency === "monthly") return `${year}-${month}`;
  if (frequency === "quarterly") {
    return `${year}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
  }
  if (frequency === "yearly") return String(year);

  if (frequency === "weekly") {
    const start = new Date(Date.UTC(year, 0, 1));
    const diff = Math.floor(
      (now.getTime() - start.getTime()) / 86400000
    );
    const week = String(
      Math.ceil((diff + start.getUTCDay() + 1) / 7)
    ).padStart(2, "0");

    return `${year}-W${week}`;
  }

  return `manual-${year}-${month}-${date}`;
}

export async function assignRoleTaskToUserAction(
  formData: FormData
) {
  const adminProfile = await getCurrentAdminProfile();
  const admin = createAdminClient();

  const profileId = String(
    formData.get("profile_id") || ""
  ).trim();
  const templateId = String(
    formData.get("template_id") || ""
  ).trim();

  if (!profileId || !templateId) {
    redirect("/settings/users?error=task_missing");
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id,user_id,role,church_id")
    .eq("id", profileId)
    .eq("church_id", adminProfile.church_id)
    .maybeSingle();

  if (!targetProfile?.user_id) {
    redirect(
      `/settings/users?profileId=${profileId}&error=${encodeURIComponent(
        "Ce profil n’est lié à aucun compte de connexion."
      )}`
    );
  }

  const normalizedRole = normalizeUserRole(targetProfile.role);

  const { data: template, error: templateError } = await admin
    .from("church_role_task_templates")
    .select("*")
    .eq("id", templateId)
    .eq("church_id", adminProfile.church_id)
    .eq("role_code", normalizedRole)
    .eq("is_active", true)
    .maybeSingle();

  if (templateError || !template) {
    redirect(
      `/settings/users?profileId=${profileId}&error=${encodeURIComponent(
        "Cette tâche n’est pas disponible pour le rôle de cet utilisateur."
      )}`
    );
  }

  const dueAt = new Date();
  dueAt.setUTCDate(
    dueAt.getUTCDate() + Number(template.default_due_days || 0)
  );

  const { error } = await admin
    .from("church_user_role_tasks")
    .insert({
      church_id: adminProfile.church_id,
      template_id: template.id,
      assigned_to: targetProfile.user_id,
      created_by: adminProfile.user_id,
      title: template.title,
      description: template.description,
      priority: template.priority,
      status: "todo",
      due_at: dueAt.toISOString(),
      source_period: taskPeriodKey(template.frequency),
      metadata: {
        source: "admin_assignment",
        role: normalizedRole,
        assigned_by_profile_id: adminProfile.id,
      },
    });

  if (error) {
    const message =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate")
        ? "Cette mission est déjà attribuée pour la période actuelle."
        : error.message;

    redirect(
      `/settings/users?profileId=${profileId}&error=${encodeURIComponent(
        message
      )}`
    );
  }

  revalidatePath("/settings/users");
  revalidatePath("/my-work");

  redirect(
    `/settings/users?profileId=${profileId}&taskAssigned=1`
  );
}
