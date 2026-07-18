import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Camera,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { USER_ROLE_OPTIONS } from "@/lib/users/userRoles";
import { updateSuperAdminUserAction } from "./actions";

type PageProps = {
  params: Promise<{
    profileId: string;
  }>;

  searchParams?: Promise<{
    error?: string;
  }>;
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
};

type ChurchSummary = {
  id: string;
  name: string;
  slug: string | null;
};

type RoleOption = {
  value: string;
  label: string;
};

function getInitials(profile: UserProfile) {
  const value =
    profile.full_name ||
    profile.email ||
    "Utilisateur";

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

export default async function EditSuperAdminUserPage({
  params,
  searchParams,
}: PageProps) {
  await requireSuperAdmin();

  const { profileId } = await params;
  const query = (await searchParams) ?? {};

  const admin = createAdminClient();

  const [
    { data: profileData, error },
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
          church_id
        `
      )
      .eq("id", profileId)
      .maybeSingle(),

    admin
      .from("churches")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  if (error || !profileData) {
    notFound();
  }

  const profile =
    profileData as UserProfile;

  if (profile.role === "super_admin") {
    redirect(`/super-admin/users/${profile.id}`);
  }

  const churches =
    (churchesData ?? []) as ChurchSummary[];

const baseRoleOptions: RoleOption[] =
  USER_ROLE_OPTIONS
    .map((option) => ({
      value: String(option.value),
      label: option.label,
    }))
    .filter(
      (option) =>
        option.value !== "super_admin"
    );

const currentRole =
  profile.role || "readonly";

const roleOptions: RoleOption[] =
  baseRoleOptions.some(
    (option) =>
      option.value === currentRole
  )
    ? baseRoleOptions
    : [
        {
          value: currentRole,
          label: currentRole,
        },
        ...baseRoleOptions,
      ];

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={`/super-admin/users/${profile.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la fiche utilisateur
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-2xl font-black text-[#03357A] shadow-lg">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.full_name ||
                    "Utilisateur"
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile)
              )}
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                Super Admin
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Modifier l’utilisateur
              </h1>

              <p className="mt-2 text-sm font-bold text-blue-100">
                {profile.full_name ||
                  profile.email}
              </p>
            </div>
          </div>
        </section>

        {query.error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
            Modification impossible :
            {" "}
            {query.error}
          </div>
        )}

        <form
          action={updateSuperAdminUserAction}
          className="space-y-6 rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
        >
          <input
            type="hidden"
            name="profile_id"
            value={profile.id}
          />

          <section>
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-[#03357A]" />

              <h2 className="text-lg font-black text-[#03357A]">
                Informations personnelles
              </h2>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <Field
                label="Nom complet"
                name="full_name"
                defaultValue={
                  profile.full_name || ""
                }
                icon={UserRound}
                required
              />

              <Field
                label="Adresse email"
                name="email"
                type="email"
                defaultValue={
                  profile.email || ""
                }
                icon={Mail}
                required
              />

              <div className="md:col-span-2">
                <Field
                  label="URL de la photo"
                  name="avatar_url"
                  type="url"
                  defaultValue={
                    profile.avatar_url || ""
                  }
                  icon={Camera}
                  placeholder="https://..."
                />

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Laissez vide pour utiliser les
                  initiales de l’utilisateur.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-[#DCEAF5]" />

          <section>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#03357A]" />

              <h2 className="text-lg font-black text-[#03357A]">
                Accès et rattachement
              </h2>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Rôle
                </span>

                <select
                  name="role"
                  defaultValue={
                    profile.role || "readonly"
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
                >
                  {roleOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Statut
                </span>

                <select
                  name="status"
                  defaultValue={
                    profile.status || "active"
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
                >
                  <option value="active">
                    Actif
                  </option>
                  <option value="inactive">
                    Inactif
                  </option>
                  <option value="suspended">
                    Suspendu
                  </option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-black text-[#03357A]">
                  <Building2 className="h-4 w-4" />
                  Église associée
                </span>

                <select
                  name="church_id"
                  defaultValue={
                    profile.church_id || ""
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
                >
                  <option value="">
                    Aucune église
                  </option>

                  {churches.map((church) => (
                    <option
                      key={church.id}
                      value={church.id}
                    >
                      {church.name}
                      {church.slug
                        ? ` — /${church.slug}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#DCEAF5] pt-5 sm:flex-row sm:justify-end">
            <Link
              href={`/super-admin/users/${profile.id}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 text-sm font-black text-[#03357A]"
            >
              <X className="h-4 w-4" />
              Annuler
            </Link>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white"
            >
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </SuperAdminShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required = false,
  icon: Icon,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  icon: typeof UserRound;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-black text-[#03357A]">
        {label}
      </span>

      <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 focus-within:border-[#03357A]">
        <Icon className="h-4 w-4 shrink-0 text-[#3F79B3]" />

        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
        />
      </span>
    </label>
  );
}