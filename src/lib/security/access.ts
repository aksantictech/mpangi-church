import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AFP_ROLES,
  CHURCH_ADMIN_ROLES,
  DEPARTMENT_ROLES,
  LOGISTIC_ROLES,
  PASTOR_ROLES,
  SECRETARY_ROLES,
  VIEWER_ROLES,
  WORKER_ROLES,
  normalizeRole,
} from "@/lib/roles";

export type PermissionAction =
  | "can_view"
  | "can_create"
  | "can_update"
  | "can_delete"
  | "can_export"
  | "can_approve";

export type ModulePermission = Record<PermissionAction, boolean>;

export type SecurityProfile = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  church_id?: string | null;
};

export type ChurchSecurityProfile = SecurityProfile & {
  church_id: string;
};

export type SecurityContext = {
  admin: ReturnType<typeof createAdminClient>;
  profile: SecurityProfile;
  role: string;
  churchId: string | null;
};

export type ChurchSecurityContext = Omit<SecurityContext, "profile" | "churchId"> & {
  profile: ChurchSecurityProfile;
  churchId: string;
};

export type ModuleAccessResult = SecurityContext & {
  moduleCode: string;
  source: "profile" | "role" | "fallback" | "super_admin";
  permissions: ModulePermission;
  granted: boolean;
  reason?: string;
};

export type RequiredModuleAccessResult = Omit<
  ModuleAccessResult,
  "profile" | "churchId"
> & {
  profile: ChurchSecurityProfile;
  churchId: string;
};

const EMPTY_PERMISSIONS: ModulePermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_export: false,
  can_approve: false,
};

const FULL_PERMISSIONS: ModulePermission = {
  can_view: true,
  can_create: true,
  can_update: true,
  can_delete: true,
  can_export: true,
  can_approve: true,
};

const SYSTEM_MODULES = new Set([
  "dashboard",
  "settings",
  "notifications",
  "pwa_install",
]);

function withChurchProfile(
  context: SecurityContext | ModuleAccessResult,
  churchId: string
) {
  return {
    ...context,
    churchId,
    profile: {
      ...context.profile,
      church_id: churchId,
    },
  };
}

function buildPermission(row: any): ModulePermission {
  return {
    can_view: Boolean(row?.can_view),
    can_create: Boolean(row?.can_create),
    can_update: Boolean(row?.can_update),
    can_delete: Boolean(row?.can_delete),
    can_export: Boolean(row?.can_export),
    can_approve: Boolean(row?.can_approve),
  };
}

function fallbackPermissions(role: string, moduleCode: string): ModulePermission {
  if (CHURCH_ADMIN_ROLES.has(role)) return FULL_PERMISSIONS;

  if (SYSTEM_MODULES.has(moduleCode)) {
    return {
      ...EMPTY_PERMISSIONS,
      can_view: true,
      can_update: moduleCode === "settings",
    };
  }

  if (PASTOR_ROLES.has(role)) {
    const allowed = [
      "members",
      "attendance",
      "souls",
      "departments",
      "events",
      "publications",
      "teachings",
      "appointments",
      "testimonies",
      "public_requests",
    ].includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: true,
      can_approve:
        role === "pastor_titulaire" || role === "pastor" || role === "pasteur",
    };
  }

  if (AFP_ROLES.has(role)) {
    const allowed = [
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
      "finance_dashboard",
      "offerings",
      "expenses",
      "budgets",
      "financial_reports",
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "teachings",
    ].includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: true,
      can_approve: true,
    };
  }

  if (SECRETARY_ROLES.has(role)) {
    const allowed = [
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
      "teachings",
    ].includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: true,
      can_approve: false,
    };
  }

  if (LOGISTIC_ROLES.has(role)) {
    const allowed = [
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "administrative_tasks",
    ].includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: true,
      can_approve: false,
    };
  }

  if (DEPARTMENT_ROLES.has(role)) {
    const allowed = [
      "members",
      "attendance",
      "souls",
      "departments",
      "events",
      "administrative_tasks",
    ].includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: false,
      can_approve: false,
    };
  }

  if (WORKER_ROLES.has(role)) {
    const allowed = ["members", "attendance", "souls", "events"].includes(
      moduleCode
    );

    return allowed
      ? {
          ...EMPTY_PERMISSIONS,
          can_view: true,
        }
      : EMPTY_PERMISSIONS;
  }

  if (VIEWER_ROLES.has(role)) {
    return {
      ...EMPTY_PERMISSIONS,
      can_view: ["members", "attendance", "souls", "events"].includes(
        moduleCode
      ),
    };
  }

  return EMPTY_PERMISSIONS;
}

function hasPermission(permissions: ModulePermission, action: PermissionAction) {
  if (action === "can_view") return permissions.can_view;

  return permissions.can_view && permissions[action];
}

export async function getSecurityContext(): Promise<SecurityContext | null> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_id, full_name, email, role, status, church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const role = normalizeRole(profile.role);

  return {
    admin,
    profile,
    role,
    churchId: profile.church_id ?? null,
  };
}

export async function requireActiveProfile() {
  const context = await getSecurityContext();

  if (!context) redirect("/login");

  if (context.profile.status && context.profile.status !== "active") {
    redirect("/unauthorized?reason=inactive");
  }

  return context;
}

export async function requireSuperAdmin() {
  const context = await requireActiveProfile();

  if (context.role !== "super_admin") {
    redirect("/unauthorized?reason=super_admin_required");
  }

  return context;
}

export async function requireChurchAdmin(): Promise<ChurchSecurityContext> {
  const context = await requireActiveProfile();

  if (!context.churchId) {
    redirect("/unauthorized?reason=church_required");
  }

  if (!CHURCH_ADMIN_ROLES.has(context.role) && !PASTOR_ROLES.has(context.role)) {
    redirect("/unauthorized?reason=church_admin_required");
  }

  return withChurchProfile(context, context.churchId) as ChurchSecurityContext;
}

export async function getChurchModuleAccess(
  moduleCode: string,
  action: PermissionAction = "can_view"
): Promise<ModuleAccessResult | null> {
  const context = await getSecurityContext();

  if (!context) return null;

  if (context.profile.status && context.profile.status !== "active") {
    return {
      ...context,
      moduleCode,
      source: "fallback",
      permissions: EMPTY_PERMISSIONS,
      granted: false,
      reason: "inactive_profile",
    };
  }

  if (context.role === "super_admin") {
    return {
      ...context,
      moduleCode,
      source: "super_admin",
      permissions: FULL_PERMISSIONS,
      granted: true,
    };
  }

  if (!context.churchId) {
    return {
      ...context,
      moduleCode,
      source: "fallback",
      permissions: EMPTY_PERMISSIONS,
      granted: false,
      reason: "missing_church",
    };
  }

  if (!SYSTEM_MODULES.has(moduleCode)) {
    const { data: churchModule } = await context.admin
      .from("church_modules")
      .select("enabled")
      .eq("church_id", context.churchId)
      .eq("module_code", moduleCode)
      .maybeSingle();

    if (!churchModule?.enabled) {
      return {
        ...context,
        moduleCode,
        source: "fallback",
        permissions: EMPTY_PERMISSIONS,
        granted: false,
        reason: "module_disabled",
      };
    }
  }

  const { data: explicitPermissions } = await context.admin
    .from("profile_module_permissions")
    .select("*")
    .eq("church_id", context.churchId)
    .eq("profile_id", context.profile.id);

  const hasExplicitProfilePermissions = (explicitPermissions ?? []).length > 0;

  if (hasExplicitProfilePermissions) {
    const profilePermission = (explicitPermissions ?? []).find(
      (permission: any) => permission.module_code === moduleCode
    );

    const permissions = buildPermission(profilePermission);

    return {
      ...context,
      moduleCode,
      source: "profile",
      permissions,
      granted: hasPermission(permissions, action),
      reason: hasPermission(permissions, action)
        ? undefined
        : "profile_permission_denied",
    };
  }

  const { data: rolePermission } = await context.admin
    .from("church_role_module_permissions")
    .select("*")
    .eq("church_id", context.churchId)
    .eq("role", context.role)
    .eq("module_code", moduleCode)
    .maybeSingle();

  if (rolePermission) {
    const permissions = buildPermission(rolePermission);

    return {
      ...context,
      moduleCode,
      source: "role",
      permissions,
      granted: hasPermission(permissions, action),
      reason: hasPermission(permissions, action)
        ? undefined
        : "role_permission_denied",
    };
  }

  const permissions = fallbackPermissions(context.role, moduleCode);

  return {
    ...context,
    moduleCode,
    source: "fallback",
    permissions,
    granted: hasPermission(permissions, action),
    reason: hasPermission(permissions, action)
      ? undefined
      : "fallback_permission_denied",
  };
}

export async function requireChurchModuleAccess(
  moduleCode: string,
  action: PermissionAction = "can_view"
): Promise<RequiredModuleAccessResult> {
  const access = await getChurchModuleAccess(moduleCode, action);

  if (!access) redirect("/login");

  if (!access.granted) {
    redirect(
      `/unauthorized?reason=${access.reason || "denied"}&module=${moduleCode}`
    );
  }

  if (!access.churchId) {
    redirect(`/unauthorized?reason=church_required&module=${moduleCode}`);
  }

  return withChurchProfile(access, access.churchId) as RequiredModuleAccessResult;
}

export async function requireSameChurchProfile(profileId: string) {
  const context = await requireChurchAdmin();

  const { data: targetProfile } = await context.admin
    .from("profiles")
    .select("id, church_id, role, status, full_name, email")
    .eq("id", profileId)
    .eq("church_id", context.churchId)
    .maybeSingle();

  if (!targetProfile) {
    redirect("/unauthorized?reason=profile_other_church");
  }

  return {
    ...context,
    targetProfile,
  };
}
