import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Save,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  updateRolePermissionAction,
  updateRoleWidgetAction,
} from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import {
  MODULE_CATALOG,
  ROLE_CATALOG,
  normalizeRoleCode,
} from "@/lib/security/roleCatalog";

type PageProps = {
  searchParams: Promise<{
    role?: string;
    saved?: string;
    error?: string;
  }>;
};

const ADMIN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
]);

export default async function RoleSettingsPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const context = await getCurrentSecurityContext();

  if (
    !context.churchId ||
    !ADMIN_ROLES.has(context.role)
  ) {
    redirect("/unauthorized?reason=role_settings");
  }

  const selectedRole = normalizeRoleCode(
    query.role || "church_admin"
  );

  const admin = createAdminClient();

  const [
    { data: permissionRows },
    { data: widgetRows },
  ] = await Promise.all([
    admin
      .from("church_role_module_permissions")
      .select("*")
      .eq("church_id", context.churchId)
      .eq("role_code", selectedRole)
      .order("module_code"),
    admin
      .from("church_role_dashboard_widgets")
      .select("*")
      .eq("church_id", context.churchId)
      .eq("role_code", selectedRole)
      .order("position"),
  ]);

  const permissions = new Map(
    (permissionRows || []).map((item) => [
      item.module_code,
      item,
    ])
  );

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
            Sécurité de l’église
          </p>

          <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
            Rôles et permissions
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
            Activez uniquement les opérations nécessaires pour
            chaque fonction.
          </p>
        </section>

        {query.saved === "1" && (
          <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            Configuration enregistrée.
          </div>
        )}

        {query.error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {query.error}
          </div>
        )}

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {ROLE_CATALOG.filter(
            (role) => role.code !== "super_admin"
          ).map((role) => (
            <Link
              key={role.code}
              href={`/settings/roles?role=${role.code}`}
              className={[
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-black shadow-sm ring-1",
                role.code === selectedRole
                  ? "bg-[#03357A] text-white ring-[#03357A]"
                  : "bg-white text-[#03357A] ring-[#DCEAF5]",
              ].join(" ")}
            >
              {role.label}
            </Link>
          ))}
        </nav>

        <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#DCEAF5] bg-white shadow-sm">
          <header className="border-b border-[#DCEAF5] p-4 sm:p-5">
            <h2 className="text-xl font-black text-[#03357A]">
              Permissions des modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chaque ligne est enregistrée séparément.
            </p>
          </header>

          <div className="divide-y divide-[#DCEAF5]">
            {MODULE_CATALOG.map(
              ([moduleCode, label, href]) => {
                const permission = permissions.get(moduleCode);

                return (
                  <form
                    key={moduleCode}
                    action={updateRolePermissionAction}
                    className="grid gap-4 p-4 lg:grid-cols-[minmax(180px,1fr)_repeat(6,auto)] lg:items-center sm:p-5"
                  >
                    <input
                      type="hidden"
                      name="role_code"
                      value={selectedRole}
                    />
                    <input
                      type="hidden"
                      name="module_code"
                      value={moduleCode}
                    />

                    <div className="min-w-0">
                      <p className="break-words font-black text-[#03357A]">
                        {label}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-400">
                        {href}
                      </p>
                    </div>

                    <PermissionCheckbox
                      name="is_enabled"
                      label="Activé"
                      defaultChecked={
                        permission?.is_enabled ?? true
                      }
                    />
                    <PermissionCheckbox
                      name="can_view"
                      label="Voir"
                      defaultChecked={
                        permission?.can_view ?? false
                      }
                    />
                    <PermissionCheckbox
                      name="can_create"
                      label="Créer"
                      defaultChecked={
                        permission?.can_create ?? false
                      }
                    />
                    <PermissionCheckbox
                      name="can_update"
                      label="Modifier"
                      defaultChecked={
                        permission?.can_update ?? false
                      }
                    />
                    <PermissionCheckbox
                      name="can_delete"
                      label="Supprimer"
                      defaultChecked={
                        permission?.can_delete ?? false
                      }
                    />
                    <PermissionCheckbox
                      name="can_approve"
                      label="Valider"
                      defaultChecked={
                        permission?.can_approve ?? false
                      }
                    />

                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#03357A] px-3 text-xs font-black text-white"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </button>
                  </form>
                );
              }
            )}
          </div>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <LayoutDashboard className="h-6 w-6 text-[#03357A]" />
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Widgets du dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Activez les cartes affichées pour le rôle sélectionné.
              </p>
            </div>
          </div>

          {(widgetRows || []).length === 0 ? (
            <p className="mt-5 rounded-2xl bg-[#F8FBFD] p-6 text-center text-sm font-bold text-slate-500">
              Aucun widget n’est encore configuré pour ce rôle.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(widgetRows || []).map((widget) => (
                <form
                  key={widget.id}
                  action={updateRoleWidgetAction}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                >
                  <input
                    type="hidden"
                    name="role_code"
                    value={selectedRole}
                  />
                  <input
                    type="hidden"
                    name="widget_code"
                    value={widget.widget_code}
                  />

                  <p className="font-black text-[#03357A]">
                    {widget.widget_code}
                  </p>

                  <div className="mt-4 grid grid-cols-[1fr_100px] gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        name="is_enabled"
                        defaultChecked={widget.is_enabled}
                        className="h-5 w-5"
                      />
                      Afficher
                    </label>

                    <input
                      type="number"
                      name="position"
                      defaultValue={widget.position}
                      min="0"
                      max="1000"
                      className="min-h-10 rounded-xl border border-[#DCEAF5] bg-white px-3"
                    />
                  </div>

                  <button
                    type="submit"
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#03357A] px-3 text-xs font-black text-white"
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </button>
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PermissionCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-[#F8FBFD] px-3 py-2 text-xs font-bold text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
