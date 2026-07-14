import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentSecurityContext,
} from "@/lib/security/permissionEngine";
import {
  getRoleLabel,
  normalizeRoleCode,
} from "@/lib/security/roleCatalog";

export type RolePermissionValidationRow = {
  roleCode: string;
  roleLabel: string;
  usersCount: number;
  enabledModules: number;
  viewModules: string[];
  createModules: string[];
  updateModules: string[];
  deleteModules: string[];
  approveModules: string[];
  warnings: string[];
};

const EXPECTED_VIEW_BASELINE: Record<string, string[]> = {
  church_admin: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "public_requests",
    "users",
    "security",
  ],
  admin_eglise: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "public_requests",
    "users",
    "security",
  ],
  pasteur_t: [
    "role_dashboard",
    "my_work",
    "souls",
    "public_requests",
    "attendance",
  ],
  pastor: [
    "role_dashboard",
    "my_work",
    "souls",
    "public_requests",
  ],
  pasteur_a: [
    "role_dashboard",
    "my_work",
    "souls",
    "attendance",
  ],
  charge_afp: [
    "role_dashboard",
    "my_work",
    "finance_dashboard",
    "offerings",
    "expenses",
    "budgets",
    "donations",
  ],
  responsable_d: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "departments",
    "events",
  ],
  logisticien: [
    "role_dashboard",
    "my_work",
    "patrimony",
    "assets",
    "maintenance",
    "movements",
  ],
  secretaire: [
    "role_dashboard",
    "my_work",
    "correspondence",
    "transmissions",
    "tasks",
    "minutes",
  ],
  worker: [
    "role_dashboard",
    "my_work",
    "attendance",
  ],
  readonly: [
    "role_dashboard",
  ],
  member: [
    "role_dashboard",
    "my_work",
  ],
};

export async function getCurrentChurchRoleValidation() {
  const context = await getCurrentSecurityContext();

  if (!context.churchId) {
    return {
      context,
      rows: [] as RolePermissionValidationRow[],
      totals: {
        roles: 0,
        users: 0,
        permissions: 0,
        warnings: 1,
      },
      globalWarnings: [
        "Aucune église n’est liée au compte courant.",
      ],
    };
  }

  const admin = createAdminClient();

  const [
    { data: permissions, error: permissionError },
    { data: profiles, error: profileError },
  ] = await Promise.all([
    admin
      .from("church_role_module_permissions")
      .select(
        `
        role_code,
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
      .order("role_code")
      .order("module_code"),
    admin
      .from("profiles")
      .select("user_id, email, role, status")
      .eq("church_id", context.churchId),
  ]);

  const globalWarnings: string[] = [];

  if (permissionError) {
    globalWarnings.push(
      `Permissions non chargées : ${permissionError.message}`
    );
  }

  if (profileError) {
    globalWarnings.push(
      `Profils non chargés : ${profileError.message}`
    );
  }

  const permissionRows = permissions || [];
  const profileRows = profiles || [];

  const roleCodes = new Set<string>();

  permissionRows.forEach((item) =>
    roleCodes.add(String(item.role_code))
  );

  profileRows.forEach((item) =>
    roleCodes.add(
      normalizeRoleCode(item.role)
    )
  );

  const rows = [...roleCodes]
    .sort()
    .map((roleCode): RolePermissionValidationRow => {
      const rolePermissions = permissionRows.filter(
        (item) =>
          String(item.role_code) === roleCode
      );

      const roleProfiles = profileRows.filter(
        (item) =>
          normalizeRoleCode(item.role) === roleCode
      );

      const enabled = rolePermissions.filter(
        (item) => item.is_enabled
      );

      const viewModules = enabled
        .filter((item) => item.can_view)
        .map((item) => String(item.module_code));

      const createModules = enabled
        .filter((item) => item.can_create)
        .map((item) => String(item.module_code));

      const updateModules = enabled
        .filter((item) => item.can_update)
        .map((item) => String(item.module_code));

      const deleteModules = enabled
        .filter((item) => item.can_delete)
        .map((item) => String(item.module_code));

      const approveModules = enabled
        .filter((item) => item.can_approve)
        .map((item) => String(item.module_code));

      const warnings: string[] = [];

      if (
        roleCode !== "super_admin" &&
        rolePermissions.length === 0
      ) {
        warnings.push(
          "Aucune permission enregistrée pour ce rôle."
        );
      }

      if (
        roleCode !== "super_admin" &&
        viewModules.length === 0
      ) {
        warnings.push(
          "Aucun module visible pour ce rôle."
        );
      }

      const expected =
        EXPECTED_VIEW_BASELINE[roleCode] || [];

      const missingExpected = expected.filter(
        (moduleCode) =>
          !viewModules.includes(moduleCode)
      );

      if (missingExpected.length > 0) {
        warnings.push(
          `Modules de référence absents : ${missingExpected.join(", ")}`
        );
      }

      const inactiveProfiles = roleProfiles.filter(
        (item) =>
          item.status &&
          String(item.status) !== "active"
      );

      if (inactiveProfiles.length > 0) {
        warnings.push(
          `${inactiveProfiles.length} compte(s) non actif(s).`
        );
      }

      return {
        roleCode,
        roleLabel: getRoleLabel(roleCode),
        usersCount: roleProfiles.length,
        enabledModules: enabled.length,
        viewModules,
        createModules,
        updateModules,
        deleteModules,
        approveModules,
        warnings,
      };
    });

  return {
    context,
    rows,
    totals: {
      roles: rows.length,
      users: profileRows.length,
      permissions: permissionRows.length,
      warnings:
        globalWarnings.length +
        rows.reduce(
          (total, item) =>
            total + item.warnings.length,
          0
        ),
    },
    globalWarnings,
  };
}
