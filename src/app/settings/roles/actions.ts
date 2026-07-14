"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import {
  MODULE_CATALOG,
  ROLE_CATALOG,
} from "@/lib/security/roleCatalog";

const ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

const VALID_ROLES = new Set(
  ROLE_CATALOG.map((role) => role.code)
);

const VALID_MODULES = new Set(
  MODULE_CATALOG.map(([moduleCode]) => moduleCode)
);

async function getAdminContext() {
  const context = await getCurrentSecurityContext();

  if (
    !context.churchId ||
    !ADMIN_ROLES.has(context.role)
  ) {
    redirect("/unauthorized?reason=role_settings");
  }

  return context;
}

export async function updateRolePermissionAction(
  formData: FormData
) {
  const context = await getAdminContext();

  const roleCode = String(formData.get("role_code") || "");
  const moduleCode = String(
    formData.get("module_code") || ""
  );

  if (
    !VALID_ROLES.has(roleCode as any) ||
    !VALID_MODULES.has(moduleCode as any)
  ) {
    redirect("/settings/roles?error=invalid_permission");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("church_role_module_permissions")
    .upsert(
      {
        church_id: context.churchId,
        role_code: roleCode,
        module_code: moduleCode,
        can_view: formData.get("can_view") === "on",
        can_create: formData.get("can_create") === "on",
        can_update: formData.get("can_update") === "on",
        can_delete: formData.get("can_delete") === "on",
        can_approve: formData.get("can_approve") === "on",
        is_enabled: formData.get("is_enabled") === "on",
      },
      {
        onConflict: "church_id,role_code,module_code",
      }
    );

  if (error) {
    redirect(
      `/settings/roles?role=${encodeURIComponent(
        roleCode
      )}&error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/settings/roles");
  redirect(
    `/settings/roles?role=${encodeURIComponent(
      roleCode
    )}&saved=1`
  );
}

export async function updateRoleWidgetAction(
  formData: FormData
) {
  const context = await getAdminContext();

  const roleCode = String(formData.get("role_code") || "");
  const widgetCode = String(
    formData.get("widget_code") || ""
  );
  const position = Number(
    formData.get("position") || 100
  );

  if (!VALID_ROLES.has(roleCode as any) || !widgetCode) {
    redirect("/settings/roles?error=invalid_widget");
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("church_role_dashboard_widgets")
    .upsert(
      {
        church_id: context.churchId,
        role_code: roleCode,
        widget_code: widgetCode,
        position: Number.isFinite(position)
          ? Math.max(0, Math.min(position, 1000))
          : 100,
        is_enabled:
          formData.get("is_enabled") === "on",
      },
      {
        onConflict: "church_id,role_code,widget_code",
      }
    );

  if (error) {
    redirect(
      `/settings/roles?role=${encodeURIComponent(
        roleCode
      )}&error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/settings/roles");
  revalidatePath("/dashboard/role");

  redirect(
    `/settings/roles?role=${encodeURIComponent(
      roleCode
    )}&saved=1`
  );
}
