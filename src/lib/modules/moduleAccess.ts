import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ModuleCategory =
  | "system"
  | "spiritual"
  | "administration"
  | "finance"
  | "patrimony";

const FULL_ACCESS_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

const ADMINISTRATION_ROLES = new Set([
  "administration_manager",
  "admin_manager",
  "charged_administration",
  "charge_administration",
  "secretaire",
  "secretary",
]);

const FINANCE_ROLES = new Set([
  "finance_manager",
  "charged_finance",
  "charge_finance",
  "tresorier",
  "treasurer",
]);

const PATRIMONY_ROLES = new Set([
  "patrimony_manager",
  "charged_patrimony",
  "charge_patrimoine",
  "patrimoine_manager",
]);

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function roleHasFallbackAccess(role: string, category: ModuleCategory) {
  if (FULL_ACCESS_ROLES.has(role)) return true;

  if (category === "system" || category === "spiritual") return true;
  if (category === "administration") return ADMINISTRATION_ROLES.has(role);
  if (category === "finance") return FINANCE_ROLES.has(role);
  if (category === "patrimony") return PATRIMONY_ROLES.has(role);

  return false;
}

export async function getChurchModuleAccess(moduleCode: string) {
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

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const role = normalizeRole(profile.role);

  const [{ data: appModule }, { data: churchModule }, { data: permission }] =
    await Promise.all([
      admin
        .from("app_modules")
        .select("code, category")
        .eq("code", moduleCode)
        .maybeSingle(),

      admin
        .from("church_modules")
        .select("module_code, enabled")
        .eq("church_id", profile.church_id)
        .eq("module_code", moduleCode)
        .maybeSingle(),

      admin
        .from("church_role_module_permissions")
        .select("can_view, can_create, can_update, can_delete, can_approve, can_export")
        .eq("church_id", profile.church_id)
        .eq("module_code", moduleCode)
        .eq("role", profile.role)
        .maybeSingle(),
    ]);

  const moduleExists = Boolean(appModule);
  const moduleEnabled = Boolean(churchModule?.enabled);
  const category = (appModule?.category || "system") as ModuleCategory;
  const canViewByPermission = Boolean(permission?.can_view);
  const canViewByFallback = roleHasFallbackAccess(role, category);

  const canView = moduleExists && moduleEnabled && (canViewByPermission || canViewByFallback);

  return {
    admin,
    profile,
    appModule,
    churchModule,
    permission,
    canView,
    moduleExists,
    moduleEnabled,
    canViewByPermission,
    canViewByFallback,
  };
}

export async function requireChurchModuleAccess(moduleCode: string) {
  const access = await getChurchModuleAccess(moduleCode);

  if (!access.canView) {
    redirect("/dashboard");
  }

  return access;
}
