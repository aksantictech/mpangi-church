import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const FULL_ACCESS_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
]);

const PASTOR_ROLES = new Set([
  "pasteur",
  "pastor",
  "pastor_titulaire",
  "pastor_assistant",
]);

const AFP_ROLES = new Set([
  "afp_manager",
  "finance_manager",
  "administration_manager",
  "patrimony_manager",
]);

const SECRETARY_ROLES = new Set(["secretary", "secretaire"]);
const LOGISTIC_ROLES = new Set(["logistician", "logisticien"]);
const DEPARTMENT_ROLES = new Set(["department_manager", "responsable_d"]);
const WORKER_ROLES = new Set(["worker", "ouvrier", "viewer", "member_manager"]);

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function fallbackCanView(role: string, moduleCode: string) {
  if (FULL_ACCESS_ROLES.has(role)) return true;

  if (PASTOR_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
      "members",
      "attendance",
      "souls",
      "departments",
      "events",
      "publications",
      "teachings",
      "public_requests",
      "appointments",
      "testimonies",
    ].includes(moduleCode);
  }

  if (AFP_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
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
  }

  if (SECRETARY_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
      "teachings",
    ].includes(moduleCode);
  }

  if (LOGISTIC_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (DEPARTMENT_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
      "members",
      "attendance",
      "souls",
      "departments",
      "events",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (WORKER_ROLES.has(role)) {
    return [
      "dashboard",
      "notifications",
      "members",
      "attendance",
      "souls",
      "events",
    ].includes(moduleCode);
  }

  return ["dashboard"].includes(moduleCode);
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
      return NextResponse.json({ error: "Profil introuvable." }, { status: 403 });
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json({ error: "Compte désactivé." }, { status: 403 });
    }

    const role = normalizeRole(profile.role);

    if (role === "super_admin") {
      return NextResponse.json({
        role,
        churchId: null,
        moduleCodes: [],
      });
    }

    if (!profile.church_id) {
      return NextResponse.json({
        role,
        churchId: null,
        moduleCodes: ["dashboard"],
      });
    }

    const admin = createAdminClient();

    const { data: enabledRows } = await admin
      .from("church_modules")
      .select("module_code, enabled")
      .eq("church_id", profile.church_id)
      .eq("enabled", true);

    const enabledCodes = new Set((enabledRows ?? []).map((row: any) => row.module_code));

    const { data: explicitPermissions } = await admin
      .from("profile_module_permissions")
      .select("module_code, can_view")
      .eq("church_id", profile.church_id)
      .eq("profile_id", profile.id);

    const hasExplicitPermissions = (explicitPermissions ?? []).length > 0;

    if (hasExplicitPermissions) {
      const moduleCodes = (explicitPermissions ?? [])
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
        .filter((code: string) => enabledCodes.has(code));

      return NextResponse.json({
        role,
        churchId: profile.church_id,
        moduleCodes: Array.from(new Set(["dashboard", ...moduleCodes])),
        source: "profile",
      });
    }

    const { data: rolePermissions } = await admin
      .from("church_role_module_permissions")
      .select("module_code, can_view")
      .eq("church_id", profile.church_id)
      .eq("role", role);

    const hasRolePermissions = (rolePermissions ?? []).length > 0;

    if (hasRolePermissions) {
      const moduleCodes = (rolePermissions ?? [])
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
        .filter((code: string) => enabledCodes.has(code));

      return NextResponse.json({
        role,
        churchId: profile.church_id,
        moduleCodes: Array.from(new Set(["dashboard", ...moduleCodes])),
        source: "role",
      });
    }

    const fallbackCodes = Array.from(enabledCodes).filter((code) =>
      fallbackCanView(role, code)
    );

    return NextResponse.json({
      role,
      churchId: profile.church_id,
      moduleCodes: Array.from(new Set(["dashboard", ...fallbackCodes])),
      source: "fallback",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les modules." },
      { status: 500 }
    );
  }
}
