import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SecurityAuditStatus =
  | "success"
  | "denied"
  | "error"
  | "warning";

export type SecurityAuditSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SecurityAuditInput = {
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  status?: SecurityAuditStatus;
  severity?: SecurityAuditSeverity;
  route?: string | null;
  metadata?: Record<string, unknown>;
  churchId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
};

type ResolvedActor = {
  userId: string | null;
  email: string | null;
  role: string | null;
  churchId: string | null;
};

type ResolvedRequest = {
  ip: string | null;
  userAgent: string | null;
  route: string | null;
};

const REDACTED_VALUE = "[MASQUÉ]";
const MAX_METADATA_DEPTH = 5;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2_000;

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|authorization|cookie|session|api[-_]?key|private[-_]?key|access[-_]?key|refresh[-_]?token|credit[-_]?card|card[-_]?number|cvv|cvc|pin|p256dh|auth/i;

function emptyActor(): ResolvedActor {
  return {
    userId: null,
    email: null,
    role: null,
    churchId: null,
  };
}

function emptyRequest(): ResolvedRequest {
  return {
    ip: null,
    userAgent: null,
    route: null,
  };
}

function normalizeText(
  value: unknown,
  maxLength = MAX_STRING_LENGTH
) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      MAX_STRING_LENGTH
    );
  }

  return String(
    error || "Erreur non documentée"
  ).slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (depth > MAX_METADATA_DEPTH) {
    return "[PROFONDEUR LIMITÉE]";
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value ?? null;
  }

  if (typeof value === "string") {
    return value.slice(
      0,
      MAX_STRING_LENGTH
    );
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.slice(
        0,
        MAX_STRING_LENGTH
      ),
    };
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) =>
        sanitizeValue(
          item,
          depth + 1,
          seen
        )
      );
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[RÉFÉRENCE CIRCULAIRE]";
    }

    seen.add(value);

    const result: Record<
      string,
      unknown
    > = {};

    for (const [key, item] of Object.entries(
      value
    )) {
      if (
        SENSITIVE_KEY_PATTERN.test(key)
      ) {
        result[key] = REDACTED_VALUE;
        continue;
      }

      result[key] = sanitizeValue(
        item,
        depth + 1,
        seen
      );
    }

    return result;
  }

  return String(value).slice(
    0,
    MAX_STRING_LENGTH
  );
}

export function sanitizeSecurityMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  const sanitized = sanitizeValue(
    metadata,
    0,
    new WeakSet<object>()
  );

  if (
    sanitized &&
    typeof sanitized === "object" &&
    !Array.isArray(sanitized)
  ) {
    return sanitized as Record<
      string,
      unknown
    >;
  }

  return {};
}

async function resolveActor(): Promise<ResolvedActor> {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return emptyActor();
    }

    const admin =
      createAdminClient();

    const { data: profile } =
      await admin
        .from("profiles")
        .select(
          "user_id, email, role, church_id"
        )
        .eq("user_id", user.id)
        .maybeSingle();

    return {
      userId: user.id,
      email:
        normalizeText(
          profile?.email ||
            user.email
        ) || null,
      role:
        normalizeText(
          profile?.role,
          100
        ) || null,
      churchId:
        normalizeText(
          profile?.church_id,
          100
        ) || null,
    };
  } catch {
    return emptyActor();
  }
}

async function resolveRequest(): Promise<ResolvedRequest> {
  try {
    const requestHeaders =
      await headers();

    const forwardedFor =
      requestHeaders.get(
        "x-forwarded-for"
      ) || "";

    const firstForwardedIp =
      forwardedFor
        .split(",")[0]
        ?.trim();

    return {
      ip:
        normalizeText(
          firstForwardedIp ||
            requestHeaders.get(
              "x-real-ip"
            ),
          100
        ) || null,

      userAgent:
        normalizeText(
          requestHeaders.get(
            "user-agent"
          ),
          1_000
        ) || null,

      route:
        normalizeText(
          requestHeaders.get(
            "x-pathname"
          ) ||
            requestHeaders.get(
              "x-invoke-path"
            ) ||
            requestHeaders.get(
              "referer"
            ),
          2_000
        ) || null,
    };
  } catch {
    return emptyRequest();
  }
}

export async function recordSecurityEvent(
  input: SecurityAuditInput
) {
  try {
    const action =
      normalizeText(
        input.action,
        200
      );

    if (!action) {
      return;
    }

    const [actor, requestContext] =
      await Promise.all([
        resolveActor(),
        resolveRequest(),
      ]);

    const admin =
      createAdminClient();

    const { error } = await admin
      .from("security_audit_logs")
      .insert({
        church_id:
          input.churchId !== undefined
            ? input.churchId
            : actor.churchId,

        actor_user_id:
          input.actorUserId !== undefined
            ? input.actorUserId
            : actor.userId,

        actor_email:
          input.actorEmail !== undefined
            ? normalizeText(
                input.actorEmail,
                320
              )
            : actor.email,

        actor_role:
          input.actorRole !== undefined
            ? normalizeText(
                input.actorRole,
                100
              )
            : actor.role,

        action,

        resource_type:
          normalizeText(
            input.resourceType,
            150
          ),

        resource_id:
          normalizeText(
            input.resourceId,
            300
          ),

        status:
          input.status ||
          "success",

        severity:
          input.severity ||
          "low",

        route:
          input.route !== undefined
            ? normalizeText(
                input.route,
                2_000
              )
            : requestContext.route,

        ip_address:
          requestContext.ip,

        user_agent:
          requestContext.userAgent,

        metadata:
          sanitizeSecurityMetadata(
            input.metadata
          ),
      });

    if (error) {
      console.error(
        "Journal sécurité non enregistré :",
        error.message
      );
    }
  } catch (error: unknown) {
    console.error(
      "Échec silencieux du journal sécurité :",
      getErrorMessage(error)
    );
  }
}

export async function withSecurityAudit<
  TResult,
>(
  input: Omit<
    SecurityAuditInput,
    "status" | "severity"
  >,
  operation: () => Promise<TResult>
): Promise<TResult> {
  try {
    const result =
      await operation();

    await recordSecurityEvent({
      ...input,
      status: "success",
      severity: "low",
    });

    return result;
  } catch (error: unknown) {
    await recordSecurityEvent({
      ...input,
      status: "error",
      severity: "high",
      metadata: {
        ...sanitizeSecurityMetadata(
          input.metadata
        ),
        error:
          getErrorMessage(error),
      },
    });

    throw error;
  }
}