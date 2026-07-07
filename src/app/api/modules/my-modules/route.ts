import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, church_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil utilisateur introuvable." },
        { status: 403 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
    }

    if (profile.role === "super_admin") {
      return NextResponse.json({
        role: profile.role,
        churchId: null,
        moduleCodes: [],
      });
    }

    if (!profile.church_id) {
      return NextResponse.json(
        { error: "Aucune église rattachée à ce compte." },
        { status: 403 }
      );
    }

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
        .select("module_code, can_view")
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

    return NextResponse.json({
      role: profile.role,
      churchId: profile.church_id,
      moduleCodes,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur pendant le chargement des modules." },
      { status: 500 }
    );
  }
}
