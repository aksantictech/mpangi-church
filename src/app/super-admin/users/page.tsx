import Link from "next/link";
import {
  Church,
  Mail,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import MetricCard from "@/components/dashboard/MetricCard";
import SuperAdminUserActions from "@/components/super-admin/SuperAdminUserActions";
import { createClient } from "@/lib/supabase/server";

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function SuperAdminUsersPage() {
  const supabase = await createClient();

  const [{ count: usersCount }, { data: profiles, error }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        avatar_url,
        role,
        status,
        created_at,
        church_id,
        churches(id, name, slug)
      `
      )
      .order("created_at", { ascending: false }),
  ]);

  const activeUsers =
    profiles?.filter((profile: any) => profile.status !== "inactive").length ??
    0;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Super Admin
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Utilisateurs de la plateforme
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Consultez les comptes créés pour les églises, modifiez leurs
                rôles, réinitialisez les mots de passe et gérez les accès.
              </p>
            </div>

            <Link
              href="/super-admin/users/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm transition hover:bg-[#EAF3FA]"
            >
              <UserPlus className="h-4 w-4" />
              Créer un utilisateur
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total utilisateurs"
            value={usersCount ?? 0}
            description="Comptes créés"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Utilisateurs actifs"
            value={activeUsers}
            description="Profils non inactifs"
            icon={ShieldCheck}
            accent="green"
          />

          <MetricCard
            title="Gestion"
            value="Multi-église"
            description="Comptes liés aux églises"
            icon={Church}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des utilisateurs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Gérez tous les utilisateurs de la plateforme depuis une seule
                vue.
              </p>
            </div>

            <Link
              href="/super-admin/users/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#022B63]"
            >
              <UserPlus className="h-4 w-4" />
              Créer un utilisateur
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Église</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-red-600">
                      Erreur : {error.message}
                    </td>
                  </tr>
                )}

                {!error && profiles?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}

                {profiles?.map((profile: any) => {
                  const church = firstItem<any>(profile.churches);

                  return (
                    <tr key={profile.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] font-bold text-[#03357A]">
                            {profile.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={profile.avatar_url}
                                alt={profile.full_name || "Utilisateur"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserCircle className="h-6 w-6" />
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-slate-800">
                              {profile.full_name || "Nom non renseigné"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Créé le{" "}
                              {profile.created_at
                                ? new Intl.DateTimeFormat("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }).format(new Date(profile.created_at))
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#3F79B3]" />
                          {profile.email || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-bold text-[#03357A]">
                          {profile.role || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {church ? (
                          <Link
                            href={`/super-admin/churches/${church.id}`}
                            className="font-bold text-[#2563EB]"
                          >
                            {church.name}
                          </Link>
                        ) : (
                          <span className="text-slate-500">Plateforme</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            profile.status === "inactive" ||
                            profile.status === "disabled"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {profile.status || "active"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <SuperAdminUserActions
                          profileId={profile.id}
                          currentRole={profile.role}
                          currentStatus={profile.status || "active"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}