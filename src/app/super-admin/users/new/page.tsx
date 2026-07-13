import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/security/access";
import { USER_ROLE_OPTIONS } from "@/lib/users/userRoles";
import { createSuperAdminUserAction } from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

async function getChurches() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("churches")
    .select("id, name, slug, status")
    .order("name", { ascending: true });

  if (error) return [];

  return data ?? [];
}

export default async function NewSuperAdminUserPage({
  searchParams,
}: PageProps) {
  await requireSuperAdmin();

  const params = (await searchParams) ?? {};
  const error = readParam(params, "error");
  const churches = await getChurches();

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/super-admin/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour paramètres
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <UserPlus className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                Super Admin
              </p>
              <h1 className="mt-2 text-3xl font-black">
                Créer un utilisateur
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Créez un compte lié à une église et attribuez son rôle.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
            Création impossible : {error}
          </div>
        )}

        <form
          action={createSuperAdminUserAction}
          className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Nom complet
              </span>
              <input
                name="full_name"
                required
                placeholder="Nom complet"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="email@eglise.org"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Mot de passe temporaire
              </span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Statut</span>
              <select
                name="status"
                defaultValue="active"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-black text-[#03357A]">Rôle</span>
              <select
                name="role"
                defaultValue="worker"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                {USER_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-black text-[#03357A]">
                Église liée
              </span>
              <select
                name="church_id"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="">Aucune église</option>
                {churches.map((church: any) => (
                  <option key={church.id} value={church.id}>
                    {church.name} /{church.slug}
                    {church.status ? ` — ${church.status}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/super-admin/settings"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A]"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
            >
              Créer l’utilisateur
            </button>
          </div>
        </form>
      </div>
    </SuperAdminShell>
  );
}
