import {
  requireAnyModulePermission,
} from "@/lib/security/routeGuard";
import type {
  PermissionAction,
} from "@/lib/security/permissionEngine";

export async function requireActionPermission(
  moduleCode: string,
  action: Exclude<PermissionAction, "view">
) {
  return requireAnyModulePermission(
    [moduleCode],
    action
  );
}

export async function requireAnyActionPermission(
  moduleCodes: string[],
  action: Exclude<PermissionAction, "view">
) {
  return requireAnyModulePermission(
    moduleCodes,
    action
  );
}

export function secureServerAction<
  TArgs extends unknown[],
  TResult,
>(
  moduleCodes: string[],
  action: Exclude<PermissionAction, "view">,
  handler: (...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    await requireAnyActionPermission(
      moduleCodes,
      action
    );

    return handler(...args);
  };
}
