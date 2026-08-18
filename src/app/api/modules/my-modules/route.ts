import { NextResponse } from "next/server";
import { getSecurityContext } from "@/lib/security/access";
import {
  AFP_ROLES,
  CHURCH_ADMIN_ROLES,
  DEPARTMENT_ROLES,
  LOGISTIC_ROLES,
  SECRETARY_ROLES,
  VIEWER_ROLES,
  WORKER_ROLES,
} from "@/lib/roles";
import {
  normalizeModuleCode,
  normalizeRoleCode,
} from "@/lib/security/roleCatalog";
import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";

const GENERAL_BASE_CODES = ["dashboard", "notifications", "pwa_install"];

const RUNTIME_SYSTEM_CODES = new Set([
  "dashboard",
  "reports",
  "notifications",
  "ai_assistant",
  "pwa_install",
  "settings",
  "users",
  "security",
  "role_dashboard",
  "my_work",
]);

const RESPONSABLE_D_ALLOWED_MODULES = new Set([
  "dashboard",
  "reports",
  "notifications",
  "pwa_install",
  "members",
  "attendance",
  "departments",
  "events",
  "administrative_tasks",
]);

const SECRETARY_ALLOWED_MODULES = new Set([
  "dashboard",
  "reports",
  "notifications",
  "ai_assistant",
  "pwa_install",
  "correspondence",
  "document_transmissions",
  "administrative_tasks",
  "meetings_minutes",
]);

const SECRETARY_CORE_MODULES = [
  "correspondence",
  "document_transmissions",
  "administrative_tasks",
  "meetings_minutes",
] as const;

function addMandatoryRoleModules(
  role: string,
  allowed: Set<string>,
  enabledCodes: Set<string>
) {
  if (role === "secretaire") {
    for (const code of SECRETARY_CORE_MODULES) {
      if (enabledCodes.has(code)) {
        allowed.add(code);
      }
    }
  }
}

function enforceRoleModuleScope(role: string, codes: string[]) {
  const uniqueCodes = Array.from(
    new Set(codes.map((code) => normalizeModuleCode(code)))
  );

  if (role === "responsable_d") {
    return uniqueCodes.filter((code) =>
      RESPONSABLE_D_ALLOWED_MODULES.has(code)
    );
  }

  if (role === "secretaire") {
    return uniqueCodes.filter((code) =>
      SECRETARY_ALLOWED_MODULES.has(code)
    );
  }

  return uniqueCodes;
}

function fallbackCanView(role: string, moduleCodeInput: string) {
  const moduleCode = normalizeModuleCode(moduleCodeInput);

  if (CHURCH_ADMIN_ROLES.has(role) || role === "church_admin") return true;

  if (["dashboard", "notifications", "pwa_install"].includes(moduleCode)) {
    return true;
  }

  if (role === "pasteur_t") {
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
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
    ].includes(moduleCode);
  }

  if (role === "pasteur_a") {
    return [
      "members",
      "attendance",
      "souls",
      "events",
      "teachings",
      "correspondence",
      "document_transmissions",
    ].includes(moduleCode);
  }

  if (role === "charge_afp" || AFP_ROLES.has(role)) {
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
    ].includes(moduleCode);
  }

  if (role === "secretaire" || SECRETARY_ROLES.has(role)) {
    return [
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
    ].includes(moduleCode);
  }

  if (role === "logisticien" || LOGISTIC_ROLES.has(role)) {
    return [
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (role === "responsable_d" || DEPARTMENT_ROLES.has(role)) {
    return [
      "members",
      "attendance",
      "departments",
      "events",
      "administrative_tasks",
    ].includes(moduleCode);
  }

  if (role === "worker" || WORKER_ROLES.has(role)) {
    return ["members", "attendance", "events"].includes(moduleCode);
  }

  if (role === "readonly" || VIEWER_ROLES.has(role)) {
    return ["members", "attendance"].includes(moduleCode);
  }

  return false;
}

function getBaseCodes(role: string) {
  if (["church_admin", "pasteur_t"].includes(role)) {
    return [
      ...GENERAL_BASE_CODES,
      "reports",
      "settings",
      "users",
      "security",
    ];
  }

  if (["secretaire", "responsable_d", "pasteur_a"].includes(role)) {
    return [...GENERAL_BASE_CODES, "reports"];
  }

  return GENERAL_BASE_CODES;
}

function codeIsGloballyAvailable(code: string, enabledCodes: Set<string>) {
  return RUNTIME_SYSTEM_CODES.has(code) || enabledCodes.has(code);
}

function applyPermissionRows(
  target: Set<string>,
  rows: any[],
  enabledCodes: Set<string>
) {
  for (const row of rows || []) {
    const code = normalizeModuleCode(row.module_code);
    if (!code) continue;

    if (row.can_view && codeIsGloballyAvailable(code, enabledCodes)) {
      target.add(code);
    } else if (!row.can_view) {
      target.delete(code);
    }
  }
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

    const { admin, profile, churchId } = context;
    const role = normalizeRoleCode(context.role);

    if (
      profile.status &&
      !["active", "actif"].includes(String(profile.status))
    ) {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
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

    const [
      { data: enabledRows },
      { data: rolePermissionRows },
      { data: profilePermissionRows },
    ] = await Promise.all([
      admin
        .from("church_modules")
        .select("module_code, is_enabled")
        .eq("church_id", churchId)
        .eq("is_enabled", true),

      admin
        .from("church_role_module_permissions")
        .select("module_code, can_view, role_code")
        .eq("church_id", churchId),

      admin
        .from("profile_module_permissions")
        .select("module_code, can_view")
        .eq("church_id", churchId)
        .eq("profile_id", profile.id),
    ]);

    const enabledCodes = new Set(
      (enabledRows ?? []).map((row: any) =>
        normalizeModuleCode(row.module_code)
      )
    );

    // L'administrateur d'église pilote tous les modules activés par le Super Admin.
    // Les anciennes permissions individuelles ne doivent jamais masquer un module
    // que l'église a explicitement activé.
    if (role === "church_admin") {
      return NextResponse.json({
        role,
        churchId,
        moduleCodes: Array.from(
          new Set([
            ...getBaseCodes(role),
            ...enabledCodes,
          ])
        ),
        source: "church_admin_enabled_modules",
      });
    }

    // 1. Socle du rôle.
    const allowed = new Set<string>(getBaseCodes(role));

    // 2. Droits fonctionnels par défaut du rôle sur les modules activés.
    for (const code of enabledCodes) {
      if (fallbackCanView(role, code)) {
        allowed.add(code);
      }
    }

    // 3. Configuration du rôle = overrides explicites, pas liste blanche.
    const matchingRoleRows = (rolePermissionRows ?? []).filter(
      (row: any) => normalizeRoleCode(row.role_code) === role
    );
    applyPermissionRows(allowed, matchingRoleRows, enabledCodes);

    // 4. Configuration individuelle = dernier niveau d'override.
    // Un utilisateur ayant une permission personnalisée pour UN module
    // ne perd plus automatiquement tous les autres modules de son rôle.
    applyPermissionRows(
      allowed,
      profilePermissionRows ?? [],
      enabledCodes
    );

    // Socle fonctionnel obligatoire du Secrétaire : ces modules restent
    // visibles tant qu'ils sont activés pour l'église, même si de vieilles
    // permissions individuelles contiennent can_view=false.
    addMandatoryRoleModules(role, allowed, enabledCodes);

    return NextResponse.json({
      role,
      churchId,
      moduleCodes: enforceRoleModuleScope(role, Array.from(allowed)),
      source:
        (profilePermissionRows ?? []).length > 0
          ? "profile+role"
          : (matchingRoleRows ?? []).length > 0
            ? "role+fallback"
            : "fallback",
    });
  } catch (error) {
    console.error("Chargement des modules impossible :", error);

    return NextResponse.json(
      { error: "Impossible de charger les modules." },
      { status: 500 }
    );
  }
}
