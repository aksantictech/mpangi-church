import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { recordSecurityEvent } from "@/lib/security/securityAudit";

export const dynamic =
  "force-dynamic";

const ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

const ALLOWED_STATUSES =
  new Set([
    "success",
    "denied",
    "error",
    "warning",
  ]);

const ALLOWED_SEVERITIES =
  new Set([
    "low",
    "medium",
    "high",
    "critical",
  ]);

function readText(
  request: NextRequest,
  key: string,
  maxLength = 200
) {
  return String(
    request.nextUrl.searchParams.get(
      key
    ) || ""
  )
    .trim()
    .slice(0, maxLength);
}

function readInteger(
  request: NextRequest,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const rawValue = Number(
    request.nextUrl.searchParams.get(
      key
    )
  );

  if (
    !Number.isFinite(rawValue)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.trunc(rawValue)
    )
  );
}

function normalizeSearch(
  value: string
) {
  return value
    .replace(
      /[^a-zA-ZÀ-ÿ0-9@._\-\s]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizeIsoDate(
  value: string,
  endOfDay = false
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return null;
  }

  const suffix = endOfDay
    ? "T23:59:59.999Z"
    : "T00:00:00.000Z";

  const date = new Date(
    `${value}${suffix}`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toISOString();
}

export async function GET(
  request: NextRequest
) {
  const context =
    await getCurrentSecurityContext();

  if (
    !ADMIN_ROLES.has(
      context.role
    )
  ) {
    await recordSecurityEvent({
      action:
        "security.audit.read_denied",
      resourceType:
        "security_audit_logs",
      status: "denied",
      severity: "high",
      actorUserId:
        context.userId,
      actorEmail:
        context.email,
      actorRole:
        context.role,
      churchId:
        context.churchId,
    });

    return NextResponse.json(
      {
        error:
          "Accès refusé.",
      },
      { status: 403 }
    );
  }

  if (
    context.role !==
      "super_admin" &&
    !context.churchId
  ) {
    return NextResponse.json(
      {
        error:
          "Aucune église associée à cette session.",
      },
      { status: 403 }
    );
  }

  const page = readInteger(
    request,
    "page",
    1,
    1,
    100_000
  );

  const pageSize =
    readInteger(
      request,
      "pageSize",
      50,
      1,
      200
    );

  const status = readText(
    request,
    "status",
    30
  );

  const severity =
    readText(
      request,
      "severity",
      30
    );

  const action = readText(
    request,
    "action",
    200
  );

  const actorRole =
    readText(
      request,
      "role",
      100
    );

  const resourceType =
    readText(
      request,
      "resourceType",
      150
    );

  const requestedChurchId =
    readText(
      request,
      "churchId",
      100
    );

  const search =
    normalizeSearch(
      readText(
        request,
        "q",
        120
      )
    );

  const fromDate =
    normalizeIsoDate(
      readText(
        request,
        "from",
        10
      )
    );

  const toDate =
    normalizeIsoDate(
      readText(
        request,
        "to",
        10
      ),
      true
    );

  if (
    status &&
    !ALLOWED_STATUSES.has(
      status
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statut d’audit invalide.",
      },
      { status: 400 }
    );
  }

  if (
    severity &&
    !ALLOWED_SEVERITIES.has(
      severity
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Niveau de sévérité invalide.",
      },
      { status: 400 }
    );
  }

  if (
    fromDate &&
    toDate &&
    fromDate > toDate
  ) {
    return NextResponse.json(
      {
        error:
          "La date de début doit précéder la date de fin.",
      },
      { status: 400 }
    );
  }

  const offset =
    (page - 1) * pageSize;

  const admin =
    createAdminClient();

  let query = admin
    .from(
      "security_audit_logs"
    )
    .select(
      `
        id,
        church_id,
        actor_user_id,
        actor_email,
        actor_role,
        action,
        resource_type,
        resource_id,
        status,
        severity,
        route,
        ip_address,
        user_agent,
        metadata,
        created_at
      `,
      {
        count: "exact",
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .range(
      offset,
      offset + pageSize - 1
    );

  if (
    context.role !==
    "super_admin"
  ) {
    query = query.eq(
      "church_id",
      context.churchId
    );
  } else if (
    requestedChurchId
  ) {
    query = query.eq(
      "church_id",
      requestedChurchId
    );
  }

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  if (severity) {
    query = query.eq(
      "severity",
      severity
    );
  }

  if (action) {
    query = query.ilike(
      "action",
      `%${action}%`
    );
  }

  if (actorRole) {
    query = query.eq(
      "actor_role",
      actorRole
    );
  }

  if (resourceType) {
    query = query.eq(
      "resource_type",
      resourceType
    );
  }

  if (fromDate) {
    query = query.gte(
      "created_at",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "created_at",
      toDate
    );
  }

  if (search) {
    query = query.or(
      [
        `action.ilike.%${search}%`,
        `actor_email.ilike.%${search}%`,
        `resource_type.ilike.%${search}%`,
        `resource_id.ilike.%${search}%`,
        `route.ilike.%${search}%`,
      ].join(",")
    );
  }

  const {
    data,
    error,
    count,
  } = await query;

  if (error) {
    await recordSecurityEvent({
      action:
        "security.audit.read_error",
      resourceType:
        "security_audit_logs",
      status: "error",
      severity: "high",
      actorUserId:
        context.userId,
      actorEmail:
        context.email,
      actorRole:
        context.role,
      churchId:
        context.churchId,
      metadata: {
        message:
          error.message,
      },
    });

    return NextResponse.json(
      {
        error:
          error.message,
      },
      { status: 500 }
    );
  }

  const total =
    count ?? 0;

  return NextResponse.json({
    data: data || [],

    pagination: {
      page,
      pageSize,
      total,
      pageCount:
        total === 0
          ? 0
          : Math.ceil(
              total /
                pageSize
            ),
    },

    filters: {
      status:
        status || null,
      severity:
        severity || null,
      action:
        action || null,
      role:
        actorRole || null,
      resourceType:
        resourceType ||
        null,
      churchId:
        context.role ===
        "super_admin"
          ? requestedChurchId ||
            null
          : context.churchId,
      search:
        search || null,
      from:
        fromDate,
      to:
        toDate,
    },
  });
}