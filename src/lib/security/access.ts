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
} from "@/lib/roles";
import {
  normalizeModuleCode,
  normalizeRoleCode,
} from "@/lib/security/roleCatalog";

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

export type ChurchSecurityContext = Omit<
  SecurityContext,
  "profile" | "churchId"
> & {
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
  "reports",
  "notifications",
  "pwa_install",
  "role_dashboard",
  "my_work",
  "settings",
  "users",
  "security",
]);

const SECRETARY_CORE_MODULES = new Set([
  "correspondence",
  "document_transmissions",
  "administrative_tasks",
  "meetings_minutes",
]);

function isSecretaryCoreModule(role: string, moduleCode: string) {
  return role === "secretaire" && SECRETARY_CORE_MODULES.has(moduleCode);
}

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
  if (!row || row.is_enabled === false) {
    return { ...EMPTY_PERMISSIONS };
  }

  return {
    can_view: Boolean(row.can_view),
    can_create: Boolean(row.can_create),
    can_update: Boolean(row.can_update),
    can_delete: Boolean(row.can_delete),
    can_export: Boolean(row.can_export),
    can_approve: Boolean(row.can_approve),
  };
}

function fallbackPermissions(
  role: string,
  moduleCodeInput: string
): ModulePermission {
  const moduleCode = normalizeModuleCode(moduleCodeInput);

  if (CHURCH_ADMIN_ROLES.has(role) || role === "church_admin") {
    return FULL_PERMISSIONS;
  }

  if (moduleCode === "settings" || moduleCode === "users" || moduleCode === "security") {
    return role === "pasteur_t"
      ? {
          ...FULL_PERMISSIONS,
          can_delete: false,
        }
      : EMPTY_PERMISSIONS;
  }

  if (
    ["dashboard", "reports", "notifications", "pwa_install", "role_dashboard", "my_work"].includes(
      moduleCode
    )
  ) {
    return {
      ...EMPTY_PERMISSIONS,
      can_view: true,
    };
  }

  if (PASTOR_ROLES.has(role) || role === "pasteur_t" || role === "pasteur_a") {
    const titular = role === "pasteur_t";

    const allowed = (
      titular
        ? [
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
            "correspondence",
            "document_transmissions",
            "administrative_tasks",
            "meetings_minutes",
          ]
        : [
            "members",
            "attendance",
            "souls",
            "events",
            "teachings",
            "correspondence",
            "document_transmissions",
          ]
    ).includes(moduleCode);

    if (!allowed) return EMPTY_PERMISSIONS;

    return {
      can_view: true,
      can_create: true,
      can_update: true,
      can_delete: false,
      can_export: true,
      can_approve: titular,
    };
  }

  if (AFP_ROLES.has(role) || role === "charge_afp") {
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
    ].includes(moduleCode);

    return allowed
      ? {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: false,
          can_export: true,
          can_approve: true,
        }
      : EMPTY_PERMISSIONS;
  }

  if (SECRETARY_ROLES.has(role) || role === "secretaire") {
    const allowed = [
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
    ].includes(moduleCode);

    return allowed
      ? {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: false,
          can_export: true,
          can_approve: false,
        }
      : EMPTY_PERMISSIONS;
  }

  if (LOGISTIC_ROLES.has(role) || role === "logisticien") {
    const allowed = [
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "administrative_tasks",
    ].includes(moduleCode);

    return allowed
      ? {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: false,
          can_export: true,
          can_approve: false,
        }
      : EMPTY_PERMISSIONS;
  }

  if (DEPARTMENT_ROLES.has(role) || role === "responsable_d") {
    const allowed = [
      "members",
      "attendance",
      "departments",
      "events",
      "administrative_tasks",
    ].includes(moduleCode);

    return allowed
      ? {
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: false,
          can_export: false,
          can_approve: false,
        }
      : EMPTY_PERMISSIONS;
  }

  if (WORKER_ROLES.has(role) || role === "worker") {
    return ["members", "attendance", "events"].includes(moduleCode)
      ? {
          ...EMPTY_PERMISSIONS,
          can_view: true,
        }
      : EMPTY_PERMISSIONS;
  }

  if (VIEWER_ROLES.has(role) || role === "readonly") {
    return {
      ...EMPTY_PERMISSIONS,
      can_view: ["members", "attendance"].includes(moduleCode),
    };
  }

  return EMPTY_PERMISSIONS;
}

function hasPermission(
  permissions: ModulePermission,
  action: PermissionAction
) {
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

  return {
    admin,
    profile,
    role: normalizeRoleCode(profile.role),
    churchId: profile.church_id ?? null,
  };
}

export async function requireActiveProfile() {
  const context = await getSecurityContext();

  if (!context) redirect("/login");

  if (
    context.profile.status &&
    !["active", "actif"].includes(String(context.profile.status))
  ) {
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

  if (
    !CHURCH_ADMIN_ROLES.has(context.role) &&
    !["pasteur_t"].includes(context.role)
  ) {
    redirect("/unauthorized?reason=church_admin_required");
  }

  return withChurchProfile(
    context,
    context.churchId
  ) as ChurchSecurityContext;
}

export async function getChurchModuleAccess(
  moduleCodeInput: string,
  action: PermissionAction = "can_view"
): Promise<ModuleAccessResult | null> {
  const context = await getSecurityContext();

  if (!context) return null;

  const moduleCode = normalizeModuleCode(moduleCodeInput);

  if (
    context.profile.status &&
    !["active", "actif"].includes(String(context.profile.status))
  ) {
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
    const { data: churchModules } = await context.admin
      .from("church_modules")
      .select("module_code, is_enabled")
      .eq("church_id", context.churchId)
      .eq("is_enabled", true);

    const enabled = (churchModules ?? []).some(
      (row: any) =>
        normalizeModuleCode(row.module_code) === moduleCode
    );

    if (!enabled) {
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

  // L'Admin Église a accès complet aux modules effectivement activés par
  // le Super Admin. Une ancienne permission de profil ne peut plus masquer
  // Courriers, Transmissions, Tâches ou un autre module actif.
  if (context.role === "church_admin") {
    return {
      ...context,
      moduleCode,
      source: "fallback",
      permissions: FULL_PERMISSIONS,
      granted: true,
    };
  }

  // Les modules cœur du Secrétaire constituent un socle fonctionnel.
  // Tant qu'ils sont activés pour l'église, une ancienne permission
  // individuelle ne doit pas les rendre inaccessibles.
  if (isSecretaryCoreModule(context.role, moduleCode)) {
    const permissions = fallbackPermissions(context.role, moduleCode);

    return {
      ...context,
      moduleCode,
      source: "fallback",
      permissions,
      granted: hasPermission(permissions, action),
      reason: hasPermission(permissions, action)
        ? undefined
        : "secretary_core_permission_denied",
    };
  }

  // Une permission individuelle ne transforme plus toute la fiche
  // utilisateur en liste blanche : elle ne surcharge que le module concerné.
  const { data: explicitPermissions } = await context.admin
    .from("profile_module_permissions")
    .select("*")
    .eq("church_id", context.churchId)
    .eq("profile_id", context.profile.id);

  const profilePermission = (explicitPermissions ?? []).find(
    (permission: any) =>
      normalizeModuleCode(permission.module_code) === moduleCode
  );

  if (profilePermission) {
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

  // Compatibilité avec les anciennes valeurs de role/module_code.
  // On filtre en TypeScript pour ne plus dépendre de la colonne historique `role`.
  const { data: rolePermissions } = await context.admin
    .from("church_role_module_permissions")
    .select("*")
    .eq("church_id", context.churchId);

  const rolePermission = (rolePermissions ?? []).find(
    (permission: any) =>
      normalizeRoleCode(permission.role_code ?? permission.role) ===
        context.role &&
      normalizeModuleCode(permission.module_code) === moduleCode
  );

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
      `/unauthorized?reason=${access.reason || "denied"}&module=${normalizeModuleCode(
        moduleCode
      )}`
    );
  }

  if (!access.churchId) {
    redirect(
      `/unauthorized?reason=church_required&module=${normalizeModuleCode(
        moduleCode
      )}`
    );
  }

  return withChurchProfile(
    access,
    access.churchId
  ) as RequiredModuleAccessResult;
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
