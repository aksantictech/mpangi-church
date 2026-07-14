import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  getCurrentChurchRoleValidation,
} from "@/lib/security/roleValidation";

const ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

export const dynamic = "force-dynamic";

export default async function SecurityValidationPage() {
  const data =
    await getCurrentChurchRoleValidation();

  if (!ADMIN_ROLES.has(data.context.role)) {
    redirect(
      "/unauthorized?reason=security_validation"
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>

        <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <ShieldCheck className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Phase 35E-4
          </p>

          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
            Validation fonctionnelle des rôles
          </h1>

          <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-blue-50">
            Contrôlez les comptes, modules visibles et actions
            autorisées pour chaque rôle de l’église.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={KeyRound}
            label="Rôles détectés"
            value={data.totals.roles}
          />
          <Metric
            icon={Users}
            label="Utilisateurs"
            value={data.totals.users}
          />
          <Metric
            icon={ShieldCheck}
            label="Permissions"
            value={data.totals.permissions}
          />
          <Metric
            icon={
              data.totals.warnings > 0
                ? AlertTriangle
                : CheckCircle2
            }
            label="Alertes"
            value={data.totals.warnings}
          />
        </section>

        {data.globalWarnings.length > 0 && (
          <section className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-black text-amber-800">
              Alertes globales
            </h2>

            <ul className="mt-3 space-y-2 text-sm font-semibold text-amber-700">
              {data.globalWarnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5 grid gap-4">
          {data.rows.map((row) => (
            <article
              key={row.roleCode}
              className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3F79B3]">
                    {row.roleCode}
                  </p>

                  <h2 className="mt-1 break-words text-xl font-black text-[#03357A]">
                    {row.roleLabel}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {row.usersCount} utilisateur(s) ·{" "}
                    {row.enabledModules} module(s) activé(s)
                  </p>
                </div>

                <Link
                  href={`/settings/roles?role=${encodeURIComponent(
                    row.roleCode
                  )}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#03357A] px-4 text-sm font-black text-white"
                >
                  Configurer
                </Link>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-5">
                <PermissionColumn
                  title="Voir"
                  values={row.viewModules}
                />
                <PermissionColumn
                  title="Créer"
                  values={row.createModules}
                />
                <PermissionColumn
                  title="Modifier"
                  values={row.updateModules}
                />
                <PermissionColumn
                  title="Supprimer"
                  values={row.deleteModules}
                />
                <PermissionColumn
                  title="Valider"
                  values={row.approveModules}
                />
              </div>

              {row.warnings.length > 0 ? (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                  <p className="font-black text-amber-800">
                    Points à vérifier
                  </p>

                  <ul className="mt-2 space-y-1 text-sm font-semibold text-amber-700">
                    {row.warnings.map((warning) => (
                      <li key={warning}>
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Configuration cohérente
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
      <Icon className="h-6 w-6 text-[#03357A]" />
      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>
    </article>
  );
}

function PermissionColumn({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-3">
      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#3F79B3]">
        {title}
      </h3>

      {values.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-slate-400">
          Aucun
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#03357A] ring-1 ring-[#DCEAF5]"
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
