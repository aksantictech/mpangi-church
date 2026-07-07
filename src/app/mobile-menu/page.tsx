import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import MobileModuleAccordion from "@/components/modules/MobileModuleAccordion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getGroupedVisibleMenuItems } from "@/lib/modules/moduleRegistry";

type AppModuleRow = {
  code: string;
  category: string;
};

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

function getFallbackAllowedCodes(role: string, enabledModules: AppModuleRow[]) {
  if (FULL_ACCESS_ROLES.has(role)) {
    return enabledModules.map((module) => module.code);
  }

  return enabledModules
    .filter((module) => {
      if (module.category === "system" || module.category === "spiritual") {
        return true;
      }

      if (module.category === "administration") {
        return ADMINISTRATION_ROLES.has(role);
      }

      if (module.category === "finance") {
        return FINANCE_ROLES.has(role);
      }

      if (module.category === "patrimony") {
        return PATRIMONY_ROLES.has(role);
      }

      return false;
    })
    .map((module) => module.code);
}

async function getEnabledModuleCodes(profile: {
  church_id: string;
  role: string;
}) {
  const admin = createAdminClient();
  const role = normalizeRole(profile.role);

  const [{ data: enabledModules }, { data: permissions }] = await Promise.all([
    admin
      .from("church_modules")
      .select("module_code, app_modules!inner(code, category)")
      .eq("church_id", profile.church_id)
      .eq("enabled", true),

    admin
      .from("church_role_module_permissions")
      .select("module_code")
      .eq("church_id", profile.church_id)
      .eq("role", profile.role)
      .eq("can_view", true),
  ]);

  const activeModules: AppModuleRow[] = (enabledModules ?? []).map(
    (row: any) => ({
      code: row.module_code,
      category: row.app_modules?.category || "system",
    })
  );

  const permissionCodes = new Set(
    (permissions ?? []).map((permission: any) => permission.module_code)
  );

  let moduleCodes = activeModules
    .map((module) => module.code)
    .filter((code) => permissionCodes.has(code));

  if (moduleCodes.length === 0) {
    moduleCodes = getFallbackAllowedCodes(role, activeModules);
  }

  return moduleCodes;
}

export default async function MobileMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, church_id")
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

  const moduleCodes = await getEnabledModuleCodes({
    church_id: profile.church_id,
    role: profile.role,
  });

  const groups = getGroupedVisibleMenuItems(moduleCodes);

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Menu mobile
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">Accès rapide</h1>

          <p className="mt-2 text-sm leading-7 text-blue-50">
            Les modules sont regroupés par volet. Ouvrez un volet pour afficher
            ses sous-menus.
          </p>
        </section>

        <MobileModuleAccordion groups={groups} />
      </div>
    </AppShell>
  );
}
