import type {
  PermissionAction,
} from "@/lib/security/permissionEngine";
import {
  requireAnyModulePermission,
} from "@/lib/security/routeGuard";
import {
  withSecurityAudit,
  type SecurityAuditSeverity,
} from "@/lib/security/securityAudit";

type MutationPermissionAction =
  Exclude<
    PermissionAction,
    "view"
  >;

export type SecureActionAuditOptions = {
  auditAction?: string;
  resourceType?: string;
  resourceId?: string | null;
  churchId?: string | null;
  severity?: SecurityAuditSeverity;
  metadata?: Record<string, unknown>;
};

function normalizeModuleCodes(
  moduleCodes: string[]
) {
  return Array.from(
    new Set(
      moduleCodes
        .map((code) =>
          String(code || "")
            .trim()
        )
        .filter(Boolean)
    )
  );
}

function buildAuditAction(
  moduleCodes: string[],
  action: MutationPermissionAction
) {
  const moduleName =
    moduleCodes.length === 1
      ? moduleCodes[0]
      : "multiple_modules";

  return `${moduleName}.${action}`;
}

export async function requireActionPermission(
  moduleCode: string,
  action: MutationPermissionAction
) {
  return requireAnyModulePermission(
    [moduleCode],
    action
  );
}

export async function requireAnyActionPermission(
  moduleCodes: string[],
  action: MutationPermissionAction
) {
  const normalizedCodes =
    normalizeModuleCodes(
      moduleCodes
    );

  if (
    normalizedCodes.length === 0
  ) {
    throw new Error(
      "Aucun module de sécurité n’a été fourni."
    );
  }

  return requireAnyModulePermission(
    normalizedCodes,
    action
  );
}

export function secureServerAction<
  TArgs extends unknown[],
  TResult,
>(
  moduleCodes: string[],
  action: MutationPermissionAction,
  handler: (
    ...args: TArgs
  ) => Promise<TResult>,
  auditOptions: SecureActionAuditOptions = {}
) {
  const normalizedCodes =
    normalizeModuleCodes(
      moduleCodes
    );

  if (
    normalizedCodes.length === 0
  ) {
    throw new Error(
      "secureServerAction exige au moins un module."
    );
  }

  return async (
    ...args: TArgs
  ): Promise<TResult> => {
    const context =
      await requireAnyActionPermission(
        normalizedCodes,
        action
      );

    const auditAction =
      auditOptions.auditAction ||
      buildAuditAction(
        normalizedCodes,
        action
      );

    return withSecurityAudit(
      {
        action: auditAction,

        resourceType:
          auditOptions.resourceType ||
          "module",

        resourceId:
          auditOptions.resourceId ||
          null,

        churchId:
          auditOptions.churchId !==
          undefined
            ? auditOptions.churchId
            : context.churchId,

        actorUserId:
          context.userId,

        actorEmail:
          context.email,

        actorRole:
          context.role,

        metadata: {
          modules:
            normalizedCodes,

          permissionAction:
            action,

          ...(auditOptions.metadata ||
            {}),
        },
      },
      () => handler(...args)
    );
  };
}