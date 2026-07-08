import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";

export default async function SuperAdminSecurityPage() {
  const { admin } = await requireSuperAdmin();

  const [
    { count: profilesCount },
    { count: inactiveCount },
    { count: customPermissionsCount },
    { count: enabledModulesCount },
    { data: auditRows, error: auditError },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("status", "active"),
    admin.from("profile_module_permissions").select("*", { count: "exact", head: true }),
    admin.from("church_modules").select("*", { count: "exact", head: true }).eq("enabled", true),
    admin
      .from("v_profile_module_access_audit")
      .select("*")
      .order("church_name", { ascending: true })
      .order("full_name", { ascending: true })
      .limit(100),
  ]);

  const rows = auditRows ?? [];
  const deniedRows = rows.filter((row: any) => {
    const hasProfilePermission = row.profile_can_view !== null && row.profile_can_view !== undefined;
    if (hasProfilePermission) return row.profile_can_view === false;
    return row.role_can_view === false || row.role_can_view === null;
  });

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Super admin</p>
              <h1 className="mt-3 text-3xl font-extrabold">Audit sécurité</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Vérifiez les comptes, modules activés et permissions par église avant l’onboarding pilote.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Profils" value={profilesCount ?? 0} description="Comptes enregistrés" icon={UsersRound} />
          <MetricCard title="Comptes inactifs" value={inactiveCount ?? 0} description="À vérifier" icon={AlertTriangle} />
          <MetricCard title="Permissions custom" value={customPermissionsCount ?? 0} description="Par utilisateur" icon={LockKeyhole} />
          <MetricCard title="Modules actifs" value={enabledModulesCount ?? 0} description="Toutes églises" icon={Database} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">Permissions visibles</h2>
              <p className="mt-1 text-sm text-slate-500">
                Vue issue de <code>v_profile_module_access_audit</code>. Maximum 100 lignes.
              </p>
            </div>
            <Link href="/super-admin/settings" className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
              Paramètres
            </Link>
          </div>

          {auditError && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              Vue d’audit indisponible : {auditError.message}
            </div>
          )}

          {!auditError && (
            <>
              <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600">
                {deniedRows.length} ligne(s) sans permission de lecture dans l’échantillon affiché.
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-[#EAF3FA] text-[#03357A]">
                    <tr>
                      <th className="px-4 py-3">Église</th>
                      <th className="px-4 py-3">Utilisateur</th>
                      <th className="px-4 py-3">Rôle</th>
                      <th className="px-4 py-3">Module</th>
                      <th className="px-4 py-3">Module actif</th>
                      <th className="px-4 py-3">Lecture profil</th>
                      <th className="px-4 py-3">Lecture rôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCEAF5] bg-white">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucune donnée d’audit.</td>
                      </tr>
                    ) : (
                      rows.map((row: any, index: number) => (
                        <tr key={`${row.profile_id}-${row.module_code}-${index}`} className="hover:bg-[#F8FBFD]">
                          <td className="px-4 py-3 font-bold text-slate-700">{row.church_name || "-"}</td>
                          <td className="px-4 py-3">
                            <p className="font-black text-[#03357A]">{row.full_name || row.email || "Utilisateur"}</p>
                            <p className="text-xs text-slate-400">{row.email}</p>
                          </td>
                          <td className="px-4 py-3"><span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">{row.role || "-"}</span></td>
                          <td className="px-4 py-3"><p className="font-bold">{row.module_name || row.module_code}</p><p className="text-xs text-slate-400">{row.category}</p></td>
                          <td className="px-4 py-3"><BooleanBadge value={row.church_module_enabled} /></td>
                          <td className="px-4 py-3"><BooleanBadge value={row.profile_can_view} nullable /></td>
                          <td className="px-4 py-3"><BooleanBadge value={row.role_can_view} nullable /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#03357A]">Audit routes côté code</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Lancez aussi <code>node scripts/audit-route-security.js</code> pour générer le rapport des routes à protéger.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

function MetricCard({ title, value, description, icon: Icon }: { title: string; value: string | number; description: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><Icon className="h-6 w-6" /></div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{title}</p>
      <h2 className="mt-1 text-3xl font-black text-[#03357A]">{value}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function BooleanBadge({ value, nullable = false }: { value: boolean | null | undefined; nullable?: boolean }) {
  if ((value === null || value === undefined) && nullable) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">Hérité</span>;
  }
  return value ? (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Oui</span>
  ) : (
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">Non</span>
  );
}
