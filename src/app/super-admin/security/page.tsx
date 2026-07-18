import Link from "next/link";
import type {
  LucideIcon,
} from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";

export const dynamic =
  "force-dynamic";

type PermissionAuditRow = {
  profile_id: string | null;
  church_id: string | null;
  church_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  module_code: string | null;
  module_name: string | null;
  category: string | null;
  church_module_enabled:
    | boolean
    | null;
  profile_can_view:
    | boolean
    | null;
  role_can_view:
    | boolean
    | null;
};

type SecurityLogRow = {
  id: string;
  church_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  status: string;
  severity: string;
  resource_type: string | null;
  resource_id: string | null;
  route: string | null;
  created_at: string;
};

function effectivePermission(
  row: PermissionAuditRow
) {
  if (
    row.church_module_enabled ===
    false
  ) {
    return false;
  }

  if (
    row.profile_can_view !==
      null &&
    row.profile_can_view !==
      undefined
  ) {
    return row.profile_can_view;
  }

  return (
    row.role_can_view === true
  );
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
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(date);
}

function statusClasses(
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

function severityClasses(
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

export default async function SuperAdminSecurityPage() {
  const { admin } =
    await requireSuperAdmin();

  const [
    profilesResult,
    inactiveResult,
    permissionsResult,
    modulesResult,
    permissionAuditResult,
    securityLogsResult,
    criticalLogsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      }),

    admin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .neq("status", "active"),

    admin
      .from(
        "profile_module_permissions"
      )
      .select("*", {
        count: "exact",
        head: true,
      }),

    admin
      .from("church_modules")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("enabled", true),

    admin
      .from(
        "v_profile_module_access_audit"
      )
      .select("*")
      .order("church_name", {
        ascending: true,
      })
      .order("full_name", {
        ascending: true,
      })
      .limit(100),

    admin
      .from(
        "security_audit_logs"
      )
      .select(
        `
          id,
          church_id,
          actor_email,
          actor_role,
          action,
          status,
          severity,
          resource_type,
          resource_id,
          route,
          created_at
        `
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(20),

    admin
      .from(
        "security_audit_logs"
      )
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("severity", [
        "high",
        "critical",
      ]),
  ]);

  const permissionRows =
    (permissionAuditResult.data ||
      []) as PermissionAuditRow[];

  const securityRows =
    (securityLogsResult.data ||
      []) as SecurityLogRow[];

  const deniedPermissionRows =
    permissionRows.filter(
      (row) =>
        !effectivePermission(
          row
        )
    );

  const permissionAuditError =
    permissionAuditResult.error;

  const securityLogsError =
    securityLogsResult.error;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Phase 36C · Super Admin
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Sécurité et audit global
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Surveillez les comptes, les permissions,
                les accès refusés et les opérations
                sensibles de toutes les églises.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Profils"
            value={
              profilesResult.count ??
              0
            }
            description="Comptes enregistrés"
            icon={UsersRound}
            tone="blue"
          />

          <MetricCard
            title="Comptes inactifs"
            value={
              inactiveResult.count ??
              0
            }
            description="À contrôler"
            icon={AlertTriangle}
            tone="orange"
          />

          <MetricCard
            title="Permissions personnalisées"
            value={
              permissionsResult.count ??
              0
            }
            description="Exceptions utilisateurs"
            icon={LockKeyhole}
            tone="violet"
          />

          <MetricCard
            title="Modules actifs"
            value={
              modulesResult.count ??
              0
            }
            description="Toutes les églises"
            icon={Database}
            tone="green"
          />

          <MetricCard
            title="Alertes élevées"
            value={
              criticalLogsResult.count ??
              0
            }
            description="Historique global"
            icon={ShieldAlert}
            tone="red"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Événements de sécurité récents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les 20 derniers événements enregistrés
                sur l’ensemble de la plateforme.
              </p>
            </div>

            <Link
              href="/api/security/audit?pageSize=200"
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 text-sm font-extrabold text-[#03357A]"
            >
              API complète
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {securityLogsError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              Journal indisponible :{" "}
              {securityLogsError.message}
            </div>
          )}

          {!securityLogsError &&
            securityRows.length ===
              0 && (
              <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-6 text-center text-sm font-bold text-slate-500">
                Aucun événement de sécurité enregistré.
              </div>
            )}

          {!securityLogsError &&
            securityRows.length >
              0 && (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-[#EAF3FA] text-[#03357A]">
                    <tr>
                      <th className="px-4 py-3">
                        Date
                      </th>
                      <th className="px-4 py-3">
                        Action
                      </th>
                      <th className="px-4 py-3">
                        Acteur
                      </th>
                      <th className="px-4 py-3">
                        Statut
                      </th>
                      <th className="px-4 py-3">
                        Sévérité
                      </th>
                      <th className="px-4 py-3">
                        Ressource
                      </th>
                      <th className="px-4 py-3">
                        Route
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#DCEAF5] bg-white">
                    {securityRows.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-[#F8FBFD]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-500">
                            {formatDate(
                              row.created_at
                            )}
                          </td>

                          <td className="px-4 py-3 font-black text-[#03357A]">
                            {row.action}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-700">
                              {row.actor_email ||
                                "Acteur inconnu"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {row.actor_role ||
                                "Rôle inconnu"}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses(
                                row.status
                              )}`}
                            >
                              {row.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${severityClasses(
                                row.severity
                              )}`}
                            >
                              {row.severity}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600">
                            {row.resource_type ||
                              "—"}

                            {row.resource_id && (
                              <p className="mt-1 max-w-48 truncate text-slate-400">
                                {row.resource_id}
                              </p>
                            )}
                          </td>

                          <td className="max-w-64 truncate px-4 py-3 text-xs text-slate-400">
                            {row.route ||
                              "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Audit des permissions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vue consolidée des modules, rôles et
                permissions personnalisées. Maximum
                100 lignes.
              </p>
            </div>

            <Link
              href="/super-admin/settings"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 text-sm font-extrabold text-[#03357A]"
            >
              Gérer les paramètres
            </Link>
          </div>

          {permissionAuditError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              Vue d’audit indisponible :{" "}
              {permissionAuditError.message}
            </div>
          )}

          {!permissionAuditError && (
            <>
              <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600">
                {
                  deniedPermissionRows.length
                }{" "}
                ligne(s) sans permission effective de
                lecture dans l’échantillon affiché.
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="bg-[#EAF3FA] text-[#03357A]">
                    <tr>
                      <th className="px-4 py-3">
                        Église
                      </th>
                      <th className="px-4 py-3">
                        Utilisateur
                      </th>
                      <th className="px-4 py-3">
                        Rôle
                      </th>
                      <th className="px-4 py-3">
                        Module
                      </th>
                      <th className="px-4 py-3">
                        Module actif
                      </th>
                      <th className="px-4 py-3">
                        Permission profil
                      </th>
                      <th className="px-4 py-3">
                        Permission rôle
                      </th>
                      <th className="px-4 py-3">
                        Accès effectif
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#DCEAF5] bg-white">
                    {permissionRows.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Aucune donnée d’audit.
                        </td>
                      </tr>
                    ) : (
                      permissionRows.map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={`${row.profile_id}-${row.module_code}-${index}`}
                            className="hover:bg-[#F8FBFD]"
                          >
                            <td className="px-4 py-3 font-bold text-slate-700">
                              {row.church_name ||
                                "—"}
                            </td>

                            <td className="px-4 py-3">
                              <p className="font-black text-[#03357A]">
                                {row.full_name ||
                                  row.email ||
                                  "Utilisateur"}
                              </p>

                              <p className="text-xs text-slate-400">
                                {row.email ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                                {row.role ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-700">
                                {row.module_name ||
                                  row.module_code ||
                                  "Module"}
                              </p>

                              <p className="text-xs text-slate-400">
                                {row.category ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <BooleanBadge
                                value={
                                  row.church_module_enabled
                                }
                              />
                            </td>

                            <td className="px-4 py-3">
                              <BooleanBadge
                                value={
                                  row.profile_can_view
                                }
                                nullable
                              />
                            </td>

                            <td className="px-4 py-3">
                              <BooleanBadge
                                value={
                                  row.role_can_view
                                }
                                nullable
                              />
                            </td>

                            <td className="px-4 py-3">
                              <BooleanBadge
                                value={effectivePermission(
                                  row
                                )}
                              />
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-green-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-green-900">
                Contrôles complémentaires
              </h2>

              <p className="mt-2 text-sm leading-7 text-green-800">
                Avant chaque déploiement, exécutez
                également l’audit statique des routes
                et le build de production.
              </p>

              <pre className="mt-3 overflow-x-auto rounded-xl bg-green-950 p-3 text-xs text-green-50">
                node scripts/audit-route-security.js
                {"\n"}
                npm run build
              </pre>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone:
    | "blue"
    | "orange"
    | "violet"
    | "green"
    | "red";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    orange:
      "bg-orange-50 text-orange-700",
    violet:
      "bg-violet-50 text-violet-700",
    green:
      "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}

function BooleanBadge({
  value,
  nullable = false,
}: {
  value:
    | boolean
    | null
    | undefined;
  nullable?: boolean;
}) {
  if (
    (value === null ||
      value === undefined) &&
    nullable
  ) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
        Hérité
      </span>
    );
  }

  return value ? (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
      Oui
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
      Non
    </span>
  );
}