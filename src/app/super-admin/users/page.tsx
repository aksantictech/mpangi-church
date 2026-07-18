import Link from "next/link";
import {
  Building2,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import SuperAdminShell from "@/components/layout/SuperAdminShell";
import SuperAdminUserActions from "@/components/super-admin/SuperAdminUserActions";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type UserProfile = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  church_id: string | null;
  created_at: string | null;
};

type ChurchSummary = {
  id: string;
  name: string;
  slug: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  church_admin: "Administrateur église",
  pastor: "Pasteur",
  pasteur: "Pasteur",
  department_leader: "Responsable département",
  worker: "Ouvrier",
  member: "Membre",
  readonly: "Lecture seule",
};

function readParam(
  params: Record<
    string,
    string | string[] | undefined
  >,
  key: string
) {
  const value = params[key];

  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getStatusClass(status: string | null) {
  if (status === "inactive") {
    return "bg-red-50 text-red-700";
  }

  if (status === "suspended") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-green-50 text-green-700";
}

function getInitials(user: UserProfile) {
  const value =
    user.full_name?.trim() ||
    user.email?.trim() ||
    "Utilisateur";

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function SuperAdminUsersPage({
  searchParams,
}: PageProps) {
  await requireSuperAdmin();

  const params = (await searchParams) ?? {};
  const search = readParam(params, "q")
    .trim()
    .toLowerCase();
  const statusFilter = readParam(params, "status");
  const churchFilter = readParam(params, "church");
  const created = readParam(params, "created");

  const admin = createAdminClient();

  const [
    { data: profilesData, error: profilesError },
    { data: churchesData },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        `
          id,
          user_id,
          full_name,
          email,
          avatar_url,
          role,
          status,
          church_id,
          created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(500),

    admin
      .from("churches")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  const users =
    (profilesData ?? []) as UserProfile[];

  const churches =
    (churchesData ?? []) as ChurchSummary[];

  const churchMap = new Map(
    churches.map((church) => [
      church.id,
      church,
    ])
  );

  const filteredUsers = users.filter((user) => {
    const church = user.church_id
      ? churchMap.get(user.church_id)
      : null;

    const matchesSearch =
      !search ||
      [
        user.full_name,
        user.email,
        user.role,
        church?.name,
        church?.slug,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );

    const matchesStatus =
      !statusFilter ||
      statusFilter === "all" ||
      (user.status || "active") === statusFilter;

    const matchesChurch =
      !churchFilter ||
      churchFilter === "all" ||
      (churchFilter === "none"
        ? !user.church_id
        : user.church_id === churchFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesChurch
    );
  });

  const activeCount = users.filter(
    (user) =>
      !user.status || user.status === "active"
  ).length;

  const linkedCount = users.filter(
    (user) => Boolean(user.church_id)
  ).length;

  const superAdminCount = users.filter(
    (user) => user.role === "super_admin"
  ).length;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                Super Admin
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Utilisateurs plateforme
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Consultez et gérez les comptes, les
                rôles, les statuts et les églises
                associées.
              </p>
            </div>

            <Link
              href="/super-admin/users/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A] shadow-sm"
            >
              <UserPlus className="h-5 w-5" />
              Créer un utilisateur
            </Link>
          </div>
        </section>

        {created && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-black text-green-700">
            Utilisateur créé avec succès.
          </div>
        )}

        {profilesError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
            Chargement des utilisateurs impossible :
            {" "}
            {profilesError.message}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total utilisateurs"
            value={users.length}
            icon={UsersRound}
            tone="bg-blue-50 text-[#03357A]"
          />

          <MetricCard
            label="Comptes actifs"
            value={activeCount}
            icon={UserCheck}
            tone="bg-green-50 text-green-700"
          />

          <MetricCard
            label="Liés à une église"
            value={linkedCount}
            icon={Building2}
            tone="bg-violet-50 text-violet-700"
          />

          <MetricCard
            label="Super administrateurs"
            value={superAdminCount}
            icon={ShieldCheck}
            tone="bg-orange-50 text-orange-700"
          />
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
          <form
            action="/super-admin/users"
            method="get"
            className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]"
          >
            <label className="relative">
              <span className="sr-only">
                Rechercher
              </span>

              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                name="q"
                defaultValue={readParam(params, "q")}
                placeholder="Nom, email, rôle ou église..."
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] pl-12 pr-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <select
              name="status"
              defaultValue={statusFilter || "all"}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            >
              <option value="all">
                Tous les statuts
              </option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">
                Suspendus
              </option>
            </select>

            <select
              name="church"
              defaultValue={churchFilter || "all"}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            >
              <option value="all">
                Toutes les églises
              </option>
              <option value="none">
                Sans église
              </option>

              {churches.map((church) => (
                <option
                  key={church.id}
                  value={church.id}
                >
                  {church.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="min-h-12 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white"
            >
              Filtrer
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-500">
            <p>
              {filteredUsers.length} utilisateur(s)
              affiché(s)
            </p>

            {(search ||
              (statusFilter &&
                statusFilter !== "all") ||
              (churchFilter &&
                churchFilter !== "all")) && (
              <Link
                href="/super-admin/users"
                className="text-[#2563EB]"
              >
                Effacer les filtres
              </Link>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-5 py-4">
                    Utilisateur
                  </th>
                  <th className="px-5 py-4">
                    Église
                  </th>
                  <th className="px-5 py-4">
                    Rôle
                  </th>
                  <th className="px-5 py-4">
                    Statut
                  </th>
                  <th className="px-5 py-4">
                    Création
                  </th>
                  <th className="px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center font-bold text-slate-500"
                    >
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const church = user.church_id
                      ? churchMap.get(user.church_id)
                      : null;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-[#F8FBFD]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3FA] text-sm font-black text-[#03357A]">
                              {getInitials(user)}
                            </div>

                            <div className="min-w-0">
                              <p className="font-black text-slate-800">
                                {user.full_name ||
                                  "Nom non renseigné"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {user.email ||
                                  "Email non renseigné"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {church ? (
                            <Link
                              href={`/super-admin/churches/${church.id}`}
                              className="font-bold text-[#2563EB]"
                            >
                              {church.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-400">
                              Plateforme globale
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#EAF3FA] px-3 py-1.5 text-xs font-black text-[#03357A]">
                            {ROLE_LABELS[
                              user.role || ""
                            ] ||
                              user.role ||
                              "Non défini"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClass(
                              user.status
                            )}`}
                          >
                            {user.status || "active"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-500">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <SuperAdminUserActions
                            profileId={user.id}
                            currentRole={
                              user.role || "readonly"
                            }
                            currentStatus={
                              user.status || "active"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>
    </div>
  );
}