import { redirect } from "next/navigation";
import { recordSecurityEvent } from "@/lib/security/securityAudit";
import {
  canAccessModule,
  getCurrentSecurityContext,
  type PermissionAction,
} from "@/lib/security/permissionEngine";
import {
  inferMutationAction,
  resolveRoutePermission,
} from "@/lib/security/routePermissionMap";

export async function canAccessAnyModule(
  moduleCodes: string[],
  action: PermissionAction = "view"
) {
  for (const moduleCode of moduleCodes) {
    if (await canAccessModule(moduleCode, action)) {
      return true;
    }
  }

  return false;
}

export async function canAccessAllModules(
  moduleCodes: string[],
  action: PermissionAction = "view"
) {
  for (const moduleCode of moduleCodes) {
    if (!(await canAccessModule(moduleCode, action))) {
      return false;
    }
  }

  return true;
}

export async function requireAnyModulePermission(
  moduleCodes: string[],
  action: PermissionAction = "view"
) {
  const allowed = await canAccessAnyModule(
    moduleCodes,
    action
  );

  if (!allowed) {
    await recordSecurityEvent({
      action: "permission.denied",
      resourceType: "module",
      status: "denied",
      severity: "high",
      metadata: { modules: moduleCodes, permissionAction: action, mode: "any" },
    });

    redirect(
      `/unauthorized?reason=module_access&modules=${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=${encodeURIComponent(action)}`
    );
  }

  return getCurrentSecurityContext();
}

export async function requireAllModulePermissions(
  moduleCodes: string[],
  action: PermissionAction = "view"
) {
  const allowed = await canAccessAllModules(
    moduleCodes,
    action
  );

  if (!allowed) {
    await recordSecurityEvent({
      action: "permission.denied",
      resourceType: "module",
      status: "denied",
      severity: "high",
      metadata: { modules: moduleCodes, permissionAction: action, mode: "all" },
    });

    redirect(
      `/unauthorized?reason=module_access_all&modules=${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=${encodeURIComponent(action)}`
    );
  }

  return getCurrentSecurityContext();
}

export async function requireRoutePermission(
  pathname: string,
  actionOverride?: PermissionAction
) {
  const rule = resolveRoutePermission(pathname);

  if (!rule || rule.public) {
    return getCurrentSecurityContext();
  }

  const action =
    actionOverride || inferMutationAction(pathname) || rule.action;

  if (rule.mode === "all") {
    return requireAllModulePermissions(
      rule.modules,
      action
    );
  }

  return requireAnyModulePermission(
    rule.modules,
    action
  );
}
