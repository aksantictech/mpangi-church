import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardPlus,
  ListTodo,
  Settings2,
  UserPlus,
} from "lucide-react";

import {
  assignRoleTaskToUserAction,
  clearProfileModulePermissionAction,
  saveProfileModulePermissionAction,
} from "./actions";
import ChurchUserProfileActions from "@/components/settings/ChurchUserProfileActions";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getUserRoleLabel,
  normalizeUserRole,
} from "@/lib/users/userRoles";

type SettingsUsersPageProps = {
  searchParams?: Promise<{
    profileId?: string;
    saved?: string;
    created?: string;
    createdUser?: string;
    updated?: string;
    deleted?: string;
    taskAssigned?: string;
    error?: string;
  }>;
};

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "admin_eglise",
  "owner",
  "pasteur",
  "pasteur_t",
  "pasteur_titulaire",
  "pastor",
  "pastor_titulaire",
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
    .select("id,user_id,role,church_id,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (
    profile.status &&
    !["active", "actif"].includes(profile.status)
  ) {
    redirect("/login");
  }

  const role = String(profile.role || "").toLowerCase();

  if (role === "super_admin") {
    redirect("/super-admin/settings");
  }

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

  const [
    { data: users },
    { data: enabledModules },
    { data: departments },
    { data: departmentAssignments },
    { data: taskRows },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,user_id,full_name,email,role,status")
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

    admin
      .from("departments")
      .select("id,name")
      .eq("church_id", adminProfile.church_id)
      .eq("status", "active")
      .order("name"),

    admin
      .from("profile_department_assignments")
      .select("profile_id,department_id")
      .eq("church_id", adminProfile.church_id),

    admin
      .from("church_user_role_tasks")
      .select("assigned_to,status")
      .eq("church_id", adminProfile.church_id)
      .in("status", ["todo", "in_progress", "blocked"]),
  ]);

  const userRows = users ?? [];
  const selectedProfileId =
    params.profileId || userRows[0]?.id || "";

  const selectedUser = userRows.find(
    (user: any) => user.id === selectedProfileId
  );

  const [{ data: permissions }, { data: taskTemplates }] =
    selectedUser
      ? await Promise.all([
          admin
            .from("profile_module_permissions")
            .select("*")
            .eq("church_id", adminProfile.church_id)
            .eq("profile_id", selectedProfileId),
          admin
            .from("church_role_task_templates")
            .select(
              "id,title,description,priority,frequency,default_due_days"
            )
            .eq("church_id", adminProfile.church_id)
            .eq(
              "role_code",
              normalizeUserRole(selectedUser.role)
            )
            .eq("is_active", true)
            .order("priority", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

  const permissionMap = new Map(
    (permissions ?? []).map((permission: any) => [
      permission.module_code,
      permission,
    ])
  );

  const departmentNameById = new Map(
    (departments || []).map((department: any) => [
      department.id,
      department.name,
    ])
  );

  const departmentIdByProfile = new Map(
    (departmentAssignments || []).map((assignment: any) => [
      assignment.profile_id,
      assignment.department_id,
    ])
  );

  const openTaskCountByUserId = new Map<string, number>();

  for (const task of taskRows || []) {
    const userId = String(task.assigned_to || "");
    if (!userId) continue;

    openTaskCountByUserId.set(
      userId,
      (openTaskCountByUserId.get(userId) || 0) + 1
    );
  }

  const selectedDepartmentId = selectedUser
    ? departmentIdByProfile.get(selectedUser.id) || null
    : null;

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
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Paramètres
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Utilisateurs, rôles & tâches
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Gérez les comptes sur une seule liste, leur rôle,
                leur département, leurs tâches et leurs permissions.
              </p>
            </div>

            <Link
              href="/settings/users/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Créer un utilisateur
            </Link>
          </div>
        </section>

        {(params.created || params.createdUser) && (
          <Notice type="success">
            Utilisateur créé avec succès.
          </Notice>
        )}

        {params.saved && (
          <Notice type="success">
            Permissions enregistrées.
          </Notice>
        )}

        {params.taskAssigned && (
          <Notice type="success">
            Tâche attribuée à l’utilisateur.
          </Notice>
        )}

        {params.deleted && (
          <Notice type="success">
            Utilisateur supprimé définitivement.
          </Notice>
        )}

        {params.error && (
          <Notice type="error">{params.error}</Notice>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#DCEAF5] p-5">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Comptes de l’église
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {userRows.length} compte(s) · cliquez sur Gérer pour
                modifier un compte ou lui attribuer une tâche.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[1.6fr_1.2fr_1.3fr_110px_100px_100px] gap-3 bg-[#F8FBFD] px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
                <span>Utilisateur</span>
                <span>Rôle</span>
                <span>Département</span>
                <span>Tâches</span>
                <span>Statut</span>
                <span>Action</span>
              </div>

              {userRows.map((user: any) => {
                const departmentId =
                  departmentIdByProfile.get(user.id);
                const active = user.id === selectedProfileId;

                return (
                  <div
                    key={user.id}
                    className={[
                      "grid grid-cols-[1.6fr_1.2fr_1.3fr_110px_100px_100px] items-center gap-3 border-t border-[#EEF4F8] px-5 py-4 text-sm",
                      active ? "bg-blue-50/60" : "bg-white",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#03357A]">
                        {user.full_name ||
                          user.email ||
                          "Utilisateur"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <span className="font-bold text-slate-700">
                      {getUserRoleLabel(user.role)}
                    </span>

                    <span className="font-semibold text-slate-600">
                      {departmentId
                        ? departmentNameById.get(departmentId) ||
                          "Département"
                        : "—"}
                    </span>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 font-black text-orange-700">
                      <ListTodo className="h-4 w-4" />
                      {openTaskCountByUserId.get(user.user_id) || 0}
                    </span>

                    <span
                      className={[
                        "w-fit rounded-full px-3 py-1.5 text-xs font-black",
                        ["active", "actif"].includes(user.status)
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {user.status || "active"}
                    </span>

                    <Link
                      href={`/settings/users?profileId=${user.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#03357A] px-3 text-xs font-black text-white"
                    >
                      Gérer
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {selectedUser && (
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-[#DCEAF5] pb-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  {selectedUser.full_name ||
                    selectedUser.email ||
                    "Utilisateur"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {getUserRoleLabel(selectedUser.role)} ·{" "}
                  {selectedUser.status || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-xs font-bold text-[#03357A]">
                Les tâches proposées dépendent automatiquement du rôle.
              </div>
            </div>

            <ChurchUserProfileActions
              key={selectedUser.id}
              profile={{
                id: selectedUser.id,
                userId: selectedUser.user_id,
                fullName: selectedUser.full_name,
                email: selectedUser.email,
                role: selectedUser.role,
                status: selectedUser.status,
              }}
              currentProfileId={adminProfile.id}
              departments={
                (departments || []) as Array<{
                  id: string;
                  name: string;
                }>
              }
              departmentId={selectedDepartmentId}
            />

            <section className="mt-5 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ClipboardPlus className="h-5 w-5 text-[#03357A]" />
                <div>
                  <h3 className="font-black text-[#03357A]">
                    Attribuer une tâche
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Seules les missions standards configurées pour le rôle
                    {` ${getUserRoleLabel(selectedUser.role)}`} sont proposées.
                  </p>
                </div>
              </div>

              {(taskTemplates || []).length === 0 ? (
                <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                  Aucune tâche standard n’est configurée pour ce rôle.
                </p>
              ) : (
                <form
                  action={assignRoleTaskToUserAction}
                  className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
                >
                  <input
                    type="hidden"
                    name="profile_id"
                    value={selectedUser.id}
                  />

                  <select
                    name="template_id"
                    required
                    className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-[#03357A]"
                  >
                    <option value="">Choisir une tâche</option>
                    {(taskTemplates || []).map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.title} · {template.frequency}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                    Attribuer
                  </button>
                </form>
              )}
            </section>

            <section className="mt-5">
              <div className="flex items-start gap-3">
                <Settings2 className="h-5 w-5 text-[#03357A]" />
                <div>
                  <h3 className="font-black text-[#03357A]">
                    Permissions particulières
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Utilisez cette zone uniquement lorsqu’un compte doit
                    déroger aux accès standards de son rôle.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {moduleRows.map((module: any) => {
                  const permission: any =
                    permissionMap.get(module.module_code);

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

                          <button
                            type="submit"
                            className="justify-self-end rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white"
                          >
                            Enregistrer
                          </button>
                        </form>

                        <form
                          action={clearProfileModulePermissionAction}
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
                          <button
                            type="submit"
                            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700"
                          >
                            Réinitialiser
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>
        )}
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

function Notice({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "success" | "error";
}) {
  return (
    <div
      className={[
        "rounded-2xl p-4 text-sm font-extrabold",
        type === "success"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      {type === "success" && (
        <CheckCircle2 className="mr-2 inline h-4 w-4" />
      )}
      {children}
    </div>
  );
}
