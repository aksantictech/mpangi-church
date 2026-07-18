import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import SuperAdminShell from "@/components/layout/SuperAdminShell";
import SuperAdminUserActions from "@/components/super-admin/SuperAdminUserActions";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    profileId: string;
  }>;
};

type UserProfile = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  church_id: string | null;
  created_at: string | null;
  avatar_url: string | null;
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
  department_leader: "Responsable département",
  worker: "Ouvrier",
  member: "Membre",
  readonly: "Lecture seule",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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

export default async function SuperAdminUserPage({
  params,
}: PageProps) {
  await requireSuperAdmin();

  const { profileId } = await params;
  const admin = createAdminClient();

  const { data: profileData, error } =
    await admin
      .from("profiles")
      .select(
        `
          id,
          user_id,
          full_name,
          email,
          role,
          status,
          church_id,
          avatar_url, 
          created_at
        `
      )
      .eq("id", profileId)
      .maybeSingle();

  if (error || !profileData) {
    notFound();
  }

  const profile =
    profileData as UserProfile;

  let church: ChurchSummary | null = null;

  if (profile.church_id) {
    const { data: churchData } = await admin
      .from("churches")
      .select("id, name, slug")
      .eq("id", profile.church_id)
      .maybeSingle();

    church =
      (churchData as ChurchSummary | null) ||
      null;
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link
            href="/super-admin/users"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux utilisateurs
          </Link>

          {profile.role !== "super_admin" && (
           <Link
  href={`/super-admin/users/${profile.id}/edit`}
  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-50 px-4 text-sm font-black text-violet-700 hover:bg-violet-100"
>
  <Pencil className="h-4 w-4" />
  Modifier le profil
</Link>
          )}
        </div>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-2xl font-black text-[#03357A] shadow-lg">
  {profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profile.avatar_url}
      alt={
        profile.full_name ||
        "Photo utilisateur"
      }
      className="h-full w-full object-cover"
    />
  ) : (
    getInitials(profile)
  )}
</div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
                Fiche utilisateur
              </p>

              <h1 className="mt-2 break-words text-3xl font-black">
                {profile.full_name ||
                  "Nom non renseigné"}
              </h1>

              <p className="mt-2 break-all text-sm font-bold text-blue-100">
                {profile.email ||
                  "Email non renseigné"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Rôle"
            value={
              ROLE_LABELS[profile.role || ""] ||
              profile.role ||
              "Non défini"
            }
            icon={ShieldCheck}
          />

          <InfoCard
            label="Statut"
            value={profile.status || "active"}
            icon={UserRound}
          />

          <InfoCard
            label="Email"
            value={
              profile.email ||
              "Non renseigné"
            }
            icon={Mail}
          />

          <InfoCard
            label="Création"
            value={formatDate(profile.created_at)}
            icon={CalendarDays}
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-black text-[#03357A]">
                Église associée
              </h2>

              {church ? (
                <>
                  <Link
                    href={`/super-admin/churches/${church.id}`}
                    className="mt-2 block font-black text-[#2563EB]"
                  >
                    {church.name}
                  </Link>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    /{church.slug}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Compte global sans église associée.
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          id="actions"
          className="scroll-mt-24 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
        >
          <h2 className="text-xl font-black text-[#03357A]">
            Modifier l’utilisateur
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Modifiez son rôle, son statut ou
            réinitialisez son mot de passe.
          </p>

          <div className="mt-5">
            <SuperAdminUserActions
              profileId={profile.id}
              currentRole={
                profile.role || "readonly"
              }
              currentStatus={
                profile.status || "active"
              }
              showNavigation={false}
            />
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-6 w-6" />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-black text-[#03357A]">
        {value}
      </p>
    </div>
  );
}