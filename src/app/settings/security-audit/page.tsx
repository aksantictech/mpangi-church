import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

export const dynamic =
  "force-dynamic";

const ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

const PAGE_SIZE = 30;

type SearchParams = {
  q?: string;
  status?: string;
  severity?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

type AuditRow = {
  id: string;
  church_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status: string;
  severity: string;
  route: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<
    string,
    unknown
  > | null;
  created_at: string;
};

function readText(
  value: string | undefined,
  maxLength = 200
) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
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

function normalizePage(
  value: string | undefined
) {
  const page = Number(value);

  if (
    !Number.isFinite(page) ||
    page < 1
  ) {
    return 1;
  }

  return Math.trunc(page);
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
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function buildPageHref(
  filters: SearchParams,
  page: number
) {
  const parameters =
    new URLSearchParams();

  for (const [key, value] of Object.entries(
    filters
  )) {
    if (
      key !== "page" &&
      value
    ) {
      parameters.set(
        key,
        value
      );
    }
  }

  parameters.set(
    "page",
    String(page)
  );

  return `/settings/security-audit?${parameters.toString()}`;
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getStatusClasses(
  status: string
) {
  switch (status) {
    case "success":
      return "bg-green-50 text-green-700";
    case "denied":
      return "bg-red-50 text-red-700";
    case "error":
      return "bg-rose-50 text-rose-700";
    case "warning":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getSeverityClasses(
  severity: string
) {
  switch (severity) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export default async function SecurityAuditPage({
  searchParams,
}: PageProps) {
  const rawFilters =
    await searchParams;

  const context =
    await getCurrentSecurityContext();

  if (
    !ADMIN_ROLES.has(
      context.role
    )
  ) {
    redirect(
      "/unauthorized?reason=security_audit"
    );
  }

  if (
    context.role !==
      "super_admin" &&
    !context.churchId
  ) {
    redirect(
      "/unauthorized?reason=church_required"
    );
  }

  const filters: SearchParams = {
    q: normalizeSearch(
      readText(
        rawFilters.q,
        120
      )
    ),
    status: readText(
      rawFilters.status,
      30
    ),
    severity: readText(
      rawFilters.severity,
      30
    ),
    action: readText(
      rawFilters.action,
      200
    ),
    from: readText(
      rawFilters.from,
      10
    ),
    to: readText(
      rawFilters.to,
      10
    ),
    page: rawFilters.page,
  };

  const page =
    normalizePage(
      filters.page
    );

  const fromDate =
    normalizeIsoDate(
      filters.from || ""
    );

  const toDate =
    normalizeIsoDate(
      filters.to || "",
      true
    );

  const offset =
    (page - 1) *
    PAGE_SIZE;

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
      offset +
        PAGE_SIZE -
        1
    );

  if (
    context.role !==
    "super_admin"
  ) {
    query = query.eq(
      "church_id",
      context.churchId
    );
  }

  if (filters.status) {
    query = query.eq(
      "status",
      filters.status
    );
  }

  if (filters.severity) {
    query = query.eq(
      "severity",
      filters.severity
    );
  }

  if (filters.action) {
    query = query.ilike(
      "action",
      `%${filters.action}%`
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

  if (filters.q) {
    query = query.or(
      [
        `action.ilike.%${filters.q}%`,
        `actor_email.ilike.%${filters.q}%`,
        `resource_type.ilike.%${filters.q}%`,
        `resource_id.ilike.%${filters.q}%`,
        `route.ilike.%${filters.q}%`,
      ].join(",")
    );
  }

  const {
    data,
    error,
    count,
  } = await query;

  const rows =
    (data || []) as AuditRow[];

  const total =
    count ?? 0;

  const pageCount =
    total === 0
      ? 0
      : Math.ceil(
          total /
            PAGE_SIZE
        );

  const deniedCount =
    rows.filter(
      (item) =>
        item.status ===
        "denied"
    ).length;

  const errorCount =
    rows.filter(
      (item) =>
        item.status ===
        "error"
    ).length;

  const criticalCount =
    rows.filter(
      (item) =>
        item.severity ===
        "critical"
    ).length;

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/20 sm:p-7">
          <ShieldCheck className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Phase 36C · Sécurité
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Journal des actions sensibles
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
            Consultez les accès refusés, erreurs,
            alertes et opérations sensibles de votre
            espace.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Résultats"
            value={total}
            description="Avec les filtres actifs"
            icon={ShieldCheck}
            tone="blue"
          />

          <MetricCard
            label="Accès refusés"
            value={deniedCount}
            description="Sur cette page"
            icon={ShieldAlert}
            tone="red"
          />

          <MetricCard
            label="Erreurs"
            value={errorCount}
            description="Sur cette page"
            icon={CircleX}
            tone="rose"
          />

          <MetricCard
            label="Critiques"
            value={criticalCount}
            description="Sur cette page"
            icon={AlertTriangle}
            tone="orange"
          />
        </section>

        <form className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-4">
            <label className="lg:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Recherche
              </span>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    filters.q || ""
                  }
                  placeholder="Action, email, ressource ou route..."
                  className="min-h-12 w-full rounded-xl border border-[#DCEAF5] pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
                />
              </div>
            </label>

            <FilterField label="Statut">
              <select
                name="status"
                defaultValue={
                  filters.status ||
                  ""
                }
                className="min-h-12 w-full rounded-xl border border-[#DCEAF5] px-3 text-sm outline-none"
              >
                <option value="">
                  Tous les statuts
                </option>
                <option value="success">
                  Succès
                </option>
                <option value="denied">
                  Refusé
                </option>
                <option value="error">
                  Erreur
                </option>
                <option value="warning">
                  Alerte
                </option>
              </select>
            </FilterField>

            <FilterField label="Sévérité">
              <select
                name="severity"
                defaultValue={
                  filters.severity ||
                  ""
                }
                className="min-h-12 w-full rounded-xl border border-[#DCEAF5] px-3 text-sm outline-none"
              >
                <option value="">
                  Toutes
                </option>
                <option value="low">
                  Faible
                </option>
                <option value="medium">
                  Moyenne
                </option>
                <option value="high">
                  Élevée
                </option>
                <option value="critical">
                  Critique
                </option>
              </select>
            </FilterField>

            <FilterField label="Action">
              <input
                name="action"
                defaultValue={
                  filters.action ||
                  ""
                }
                placeholder="Ex. permission.denied"
                className="min-h-12 w-full rounded-xl border border-[#DCEAF5] px-4 text-sm outline-none"
              />
            </FilterField>

            <FilterField label="Depuis">
              <input
                type="date"
                name="from"
                defaultValue={
                  filters.from ||
                  ""
                }
                className="min-h-12 w-full rounded-xl border border-[#DCEAF5] px-4 text-sm outline-none"
              />
            </FilterField>

            <FilterField label="Jusqu’au">
              <input
                type="date"
                name="to"
                defaultValue={
                  filters.to ||
                  ""
                }
                className="min-h-12 w-full rounded-xl border border-[#DCEAF5] px-4 text-sm outline-none"
              />
            </FilterField>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#03357A] px-5 text-sm font-black text-white"
              >
                <Search className="h-4 w-4" />
                Filtrer
              </button>

              <Link
                href="/settings/security-audit"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-600"
              >
                Effacer
              </Link>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Journal indisponible : {error.message}
          </div>
        )}

        {!error && (
          <section className="mt-5 grid gap-3">
            {rows.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-8 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-4 font-black text-[#03357A]">
                  Aucun événement trouvé
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Modifiez les filtres ou la période recherchée.
                </p>
              </div>
            ) : (
              rows.map((item) => (
                <AuditCard
                  key={item.id}
                  item={item}
                />
              ))
            )}
          </section>
        )}

        {!error &&
          pageCount > 1 && (
            <nav
              aria-label="Pagination du journal"
              className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4"
            >
              <p className="text-sm font-bold text-slate-500">
                Page {page} sur {pageCount}
              </p>

              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={buildPageHref(
                      filters,
                      page - 1
                    )}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-400">
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </span>
                )}

                {page < pageCount ? (
                  <Link
                    href={buildPageHref(
                      filters,
                      page + 1
                    )}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-400">
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
      </div>
    </main>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof ShieldCheck;
  tone:
    | "blue"
    | "red"
    | "rose"
    | "orange";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    rose: "bg-rose-50 text-rose-700",
    orange:
      "bg-orange-50 text-orange-700",
  };

  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-400">
        {description}
      </p>
    </article>
  );
}

function AuditCard({
  item,
}: {
  item: AuditRow;
}) {
  const hasMetadata =
    item.metadata &&
    Object.keys(
      item.metadata
    ).length > 0;

  return (
    <article className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                item.status
              )}`}
            >
              {item.status}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getSeverityClasses(
                item.severity
              )}`}
            >
              {item.severity}
            </span>

            {item.actor_role && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                {item.actor_role}
              </span>
            )}
          </div>

          <h2 className="mt-3 break-words text-lg font-black text-[#03357A]">
            {item.action}
          </h2>

          <p className="mt-2 break-words text-sm font-semibold text-slate-600">
            {item.actor_email ||
              "Acteur inconnu"}
          </p>

          {(item.resource_type ||
            item.resource_id) && (
            <p className="mt-2 break-words text-xs font-bold text-slate-500">
              Ressource :{" "}
              {item.resource_type ||
                "non définie"}
              {item.resource_id
                ? ` · ${item.resource_id}`
                : ""}
            </p>
          )}

          {item.route && (
            <p className="mt-2 break-all text-xs text-slate-400">
              {item.route}
            </p>
          )}

          {item.ip_address && (
            <p className="mt-1 text-xs text-slate-400">
              Adresse IP : {item.ip_address}
            </p>
          )}
        </div>

        <time className="shrink-0 text-xs font-bold text-slate-400">
          {formatDate(item.created_at)}
        </time>
      </div>

      {hasMetadata && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-black text-[#2563EB]">
            Afficher les détails techniques
          </summary>

          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-6 text-slate-100">
            {JSON.stringify(
              item.metadata,
              null,
              2
            )}
          </pre>
        </details>
      )}
    </article>
  );
}