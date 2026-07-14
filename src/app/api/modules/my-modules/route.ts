import { NextResponse } from "next/server";
import { getSecurityContext } from "@/lib/security/access";
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

import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";
function fallbackCanView(role: string, moduleCode: string) {
  if (CHURCH_ADMIN_ROLES.has(role)) return true;

  if (["dashboard", "settings", "notifications", "pwa_install"].includes(moduleCode)) {
    return true;
  }

  if (PASTOR_ROLES.has(role)) {
    return [
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
  }

  if (AFP_ROLES.has(role)) {
    return [
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
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
      "teachings",
    ].includes(moduleCode);
  }

  if (LOGISTIC_ROLES.has(role)) {
    return [
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (DEPARTMENT_ROLES.has(role)) {
    return [
      "members",
      "attendance",
      "souls",
      "departments",
      "events",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (WORKER_ROLES.has(role)) {
    return ["members", "attendance", "souls", "events"].includes(moduleCode);
  }

  if (VIEWER_ROLES.has(role)) {
    return ["members", "attendance", "souls", "events"].includes(moduleCode);
  }

  return false;
}

export async function GET() {
  await requireAuthenticatedAccess();
  try {
    const context = await getSecurityContext();

    if (!context) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const { admin, profile, role, churchId } = context;

    if (profile.status && profile.status !== "active") {
      return NextResponse.json({ error: "Compte désactivé." }, { status: 403 });
    }

    if (role === "super_admin") {
      return NextResponse.json({
        role,
        churchId: null,
        moduleCodes: [],
      });
    }

    if (!churchId) {
      return NextResponse.json({
        role,
        churchId: null,
        moduleCodes: ["dashboard"],
      });
    }

    const { data: enabledRows } = await admin
      .from("church_modules")
      .select("module_code, enabled")
      .eq("church_id", churchId)
      .eq("enabled", true);

    const enabledCodes = new Set(
      (enabledRows ?? []).map((row: any) => row.module_code)
    );

    const { data: explicitPermissions } = await admin
      .from("profile_module_permissions")
      .select("module_code, can_view")
      .eq("church_id", churchId)
      .eq("profile_id", profile.id);

    if ((explicitPermissions ?? []).length > 0) {
      const moduleCodes = (explicitPermissions ?? [])
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
        .filter((code: string) => enabledCodes.has(code));

      return NextResponse.json({
        role,
        churchId,
        moduleCodes: Array.from(
          new Set(["dashboard", "settings", "notifications", ...moduleCodes])
        ),
        source: "profile",
      });
    }

    const { data: rolePermissions } = await admin
      .from("church_role_module_permissions")
      .select("module_code, can_view")
      .eq("church_id", churchId)
      .eq("role", role);

    if ((rolePermissions ?? []).length > 0) {
      const moduleCodes = (rolePermissions ?? [])
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
        .filter((code: string) => enabledCodes.has(code));

      return NextResponse.json({
        role,
        churchId,
        moduleCodes: Array.from(
          new Set(["dashboard", "settings", "notifications", ...moduleCodes])
        ),
        source: "role",
      });
    }

    const fallbackCodes = Array.from(enabledCodes).filter((code) =>
      fallbackCanView(role, code)
    );

    return NextResponse.json({
      role,
      churchId,
      moduleCodes: Array.from(
        new Set(["dashboard", "settings", "notifications", ...fallbackCodes])
      ),
      source: "fallback",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les modules." },
      { status: 500 }
    );
  }
}
