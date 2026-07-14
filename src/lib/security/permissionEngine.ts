import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeRoleCode,
  type ModuleCode,
  type RoleCode,
} from "@/lib/security/roleCatalog";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve";

export type CurrentSecurityContext = {
  userId: string;
  email: string | null;
  fullName: string;
  role: RoleCode;
  churchId: string | null;
  churchName: string | null;
  churchSlug: string | null;
};

export type ModulePermission = {
  module_code: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  is_enabled: boolean;
};

export const getCurrentSecurityContext = cache(
  async (): Promise<CurrentSecurityContext> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?reason=auth_required");
    }

    const admin = createAdminClient();

    const { data: profile, error } = await admin
      .from("profiles")
      .select(
        `
        user_id,
        email,
        full_name,
        role,
        church_id,
        churches (
          name,
          slug
        )
      `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !profile) {
      redirect("/unauthorized?reason=profile_missing");
    }

    const churchValue = Array.isArray(profile.churches)
      ? profile.churches[0]
      : profile.churches;

    return {
      userId: user.id,
      email: profile.email || user.email || null,
      fullName:
        profile.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Utilisateur",
      role: normalizeRoleCode(profile.role),
      churchId: profile.church_id || null,
      churchName: churchValue?.name || null,
      churchSlug: churchValue?.slug || null,
    };
  }
);

export const getCurrentRolePermissions = cache(
  async (): Promise<ModulePermission[]> => {
    const context = await getCurrentSecurityContext();

    if (!context.churchId) return [];

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("church_role_module_permissions")
      .select(
        `
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete,
        can_approve,
        is_enabled
      `
      )
      .eq("church_id", context.churchId)
      .eq("role_code", context.role);

    if (error) {
      console.error(
        "Impossible de charger les permissions Phase 35E :",
        error.message
      );

      return [];
    }

    return (data || []) as ModulePermission[];
  }
);

export async function canAccessModule(
  moduleCode: ModuleCode | string,
  action: PermissionAction = "view"
) {
  const context = await getCurrentSecurityContext();

  if (context.role === "super_admin") return true;

  const permissions = await getCurrentRolePermissions();
  const permission = permissions.find(
    (item) => item.module_code === moduleCode
  );

  if (!permission || !permission.is_enabled) return false;

  switch (action) {
    case "create":
      return permission.can_create;
    case "update":
      return permission.can_update;
    case "delete":
      return permission.can_delete;
    case "approve":
      return permission.can_approve;
    default:
      return permission.can_view;
  }
}

export async function requireModulePermission(
  moduleCode: ModuleCode | string,
  action: PermissionAction = "view"
) {
  const allowed = await canAccessModule(moduleCode, action);

  if (!allowed) {
    redirect(
      `/unauthorized?reason=module_access&module=${encodeURIComponent(
        moduleCode
      )}&action=${encodeURIComponent(action)}`
    );
  }

  return getCurrentSecurityContext();
}

export function permissionToActionKey(
  action: PermissionAction
): keyof ModulePermission {
  switch (action) {
    case "create":
      return "can_create";
    case "update":
      return "can_update";
    case "delete":
      return "can_delete";
    case "approve":
      return "can_approve";
    default:
      return "can_view";
  }
}
