"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
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
    .select("id, role, church_id, status")
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