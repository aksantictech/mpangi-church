import { redirect } from "next/navigation";
import {
  clearProfileModulePermissionAction,
  saveProfileModulePermissionAction,
} from "./actions";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import ChurchUserProfileActions from "@/components/settings/ChurchUserProfileActions";

import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SettingsUsersPageProps = {
  searchParams?: Promise<{
    profileId?: string;
    saved?: string;
    created?: string;
    createdUser?: string;
    updated?: string;
    deleted?: string;
  }>;
};

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

const CATEGORY_LABELS: Record<string, string> = {
  system: "Général",
  spiritual: "Volet spirituel",
  administration: "Volet administratif",
  finance: "Volet finances",
  patrimony: "Volet patrimoine",
};


async function getCurrentAdminProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.status && profile.status !== "active") redirect("/login");

  const role = String(profile.role || "").toLowerCase();

  if (role === "super_admin") redirect("/super-admin/settings");

  if (!profile.church_id || !ADMIN_ROLES.has(role)) {
    redirect("/dashboard");
  }

  return profile;
}


export default async function SettingsUsersPage({
  searchParams,
}: SettingsUsersPageProps) {
  const params = searchParams ? await searchParams : {};
  const adminProfile = await getCurrentAdminProfile();
  const admin = createAdminClient();

  const [{ data: users }, { data: enabledModules }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, user_id, full_name, email, role, status")
      .eq("church_id", adminProfile.church_id)
      .order("full_name", { ascending: true }),

    admin
      .from("church_modules")
      .select(
        `
        module_code,
        enabled,
        module:app_modules(code, name, category, description)
        `
      )
      .eq("church_id", adminProfile.church_id)
      .eq("enabled", true),
  ]);

  const userRows = users ?? [];
  const selectedProfileId = params.profileId || userRows[0]?.id || "";

  const { data: permissions } = selectedProfileId
    ? await admin
        .from("profile_module_permissions")
        .select("*")
        .eq("church_id", adminProfile.church_id)
        .eq("profile_id", selectedProfileId)
    : { data: [] };

  const selectedUser = userRows.find(
    (user: any) => user.id === selectedProfileId
  );

  const permissionMap = new Map(
    (permissions ?? []).map((permission: any) => [
      permission.module_code,
      permission,
    ])
  );

  const moduleRows = (enabledModules ?? [])
    .map((row: any) => ({
      module_code: row.module_code,
      name: row.module?.name || row.module_code,
      category: row.module?.category || "system",
      description: row.module?.description || "",
    }))
    .sort((a: any, b: any) => {
      const categoryCompare = String(a.category).localeCompare(
        String(b.category)
      );

      if (categoryCompare !== 0) return categoryCompare;

      return String(a.name).localeCompare(String(b.name));
    });

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Paramètres
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Utilisateurs & rôles
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Assignez les modules et actions autorisées pour chaque compte.
                Dès qu’un utilisateur a au moins une permission personnalisée,
                il ne voit que les modules cochés.
              </p>
            </div>

            <Link
              href="/settings/users/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm transition hover:bg-[#EAF3FA]"
            >
              <UserPlus className="h-4 w-4" />
              Créer un utilisateur
            </Link>
          </div>
        </section>

        {(params.created || params.createdUser) && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
            Utilisateur créé avec succès.
          </div>
        )}

        {params.saved && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
            Permissions enregistrées.
          </div>
        )}

        {params.deleted && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
            Utilisateur supprimé définitivement.
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-2">
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Comptes église
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {userRows.length} compte(s)
                </p>
              </div>

              <Link
                href="/settings/users/new"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#03357A] text-white shadow-sm transition hover:bg-[#022B63]"
                aria-label="Créer un utilisateur"
              >
                <UserPlus className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {userRows.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-500">
                  Aucun utilisateur rattaché à cette église.
                </div>
              ) : (
                userRows.map((user: any) => {
                  const active = user.id === selectedProfileId;

                  return (
                    <Link
                      key={user.id}
                      href={`/settings/users?profileId=${user.id}`}
                      className={`block rounded-2xl px-4 py-3 transition ${
                        active
                          ? "bg-[#03357A] text-white"
                          : "bg-[#F8FBFD] text-slate-700 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                      }`}
                    >
                      <span className="block text-sm font-black">
                        {user.full_name || user.email || "Utilisateur"}
                      </span>

                      <span
                        className={`mt-1 block text-xs font-semibold ${
                          active ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {user.role || "role non défini"} ·{" "}
                        {user.status || "actif"}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            {!selectedUser ? (
              <div className="py-12 text-center">
                <p className="font-extrabold text-[#03357A]">
                  Aucun utilisateur sélectionné.
                </p>

                <Link
                  href="/settings/users/new"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#022B63]"
                >
                  <UserPlus className="h-4 w-4" />
                  Créer un utilisateur
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-4 border-b border-[#DCEAF5] pb-5 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#03357A]">
                      {selectedUser.full_name ||
                        selectedUser.email ||
                        "Utilisateur"}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Rôle : {selectedUser.role || "-"} · Statut :{" "}
                      {selectedUser.status || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-xs font-bold text-[#03357A]">
                    Les cases enregistrées deviennent la source d’accès
                    personnalisée.
                  </div>
                </div>


                <ChurchUserProfileActions
                  profile={{
                    id: selectedUser.id,
                    userId: selectedUser.user_id,
                    fullName: selectedUser.full_name,
                    email: selectedUser.email,
                    role: selectedUser.role,
                    status: selectedUser.status,
                  }}
                  currentProfileId={adminProfile.id}
                />

                <div className="mt-5 space-y-4">
                  {moduleRows.map((module: any) => {
                    const permission: any = permissionMap.get(
                      module.module_code
                    );

                    return (
                      <div
                        key={module.module_code}
                        className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              {CATEGORY_LABELS[module.category] ||
                                module.category}
                            </p>

                            <h3 className="mt-1 font-black text-[#03357A]">
                              {module.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              Code : {module.module_code}
                            </p>
                          </div>

                          <form
                            action={saveProfileModulePermissionAction}
                            className="grid gap-3 rounded-2xl bg-white p-3 xl:min-w-[560px]"
                          >
                            <input
                              type="hidden"
                              name="profile_id"
                              value={selectedUser.id}
                            />

                            <input
                              type="hidden"
                              name="module_code"
                              value={module.module_code}
                            />

                            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                              <Check
                                name="can_view"
                                label="Voir"
                                defaultChecked={permission?.can_view}
                              />

                              <Check
                                name="can_create"
                                label="Créer"
                                defaultChecked={permission?.can_create}
                              />

                              <Check
                                name="can_update"
                                label="Modifier"
                                defaultChecked={permission?.can_update}
                              />

                              <Check
                                name="can_delete"
                                label="Supprimer"
                                defaultChecked={permission?.can_delete}
                              />

                              <Check
                                name="can_export"
                                label="Exporter"
                                defaultChecked={permission?.can_export}
                              />

                              <Check
                                name="can_approve"
                                label="Valider"
                                defaultChecked={permission?.can_approve}
                              />
                            </div>

                            <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                              <button
                                type="submit"
                                className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#022B63]"
                              >
                                Enregistrer
                              </button>
                            </div>
                          </form>

                          <form action={clearProfileModulePermissionAction}>
                            <input
                              type="hidden"
                              name="profile_id"
                              value={selectedUser.id}
                            />

                            <input
                              type="hidden"
                              name="module_code"
                              value={module.module_code}
                            />

                            <button
                              type="submit"
                              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100"
                            >
                              Réinitialiser
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl bg-[#F8FBFD] px-3 py-2 text-xs font-extrabold text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={Boolean(defaultChecked)}
        className="h-4 w-4 rounded border-[#DCEAF5] text-[#03357A]"
      />
      {label}
    </label>
  );
}