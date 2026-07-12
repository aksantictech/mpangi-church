import Link from "next/link";
import { ArrowLeft, Camera, Save, UserRound } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { updateSuperAdminProfile } from "@/app/super-admin/profile/actions";

export default async function SuperAdminProfilePage() {
  await requireSuperAdmin();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role")
    .eq("id", user?.id)
    .maybeSingle();

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Super admin";
  const email = profile?.email || user?.email || "";

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/super-admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Compte super admin
          </p>
          <h1 className="mt-3 text-3xl font-black">Modifier mon profil</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Mettez à jour votre nom, téléphone et photo de profil.
          </p>
        </section>

        <form
          action={updateSuperAdminProfile}
          className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
        >
          <input
            type="hidden"
            name="current_avatar_url"
            value={profile?.avatar_url || ""}
          />

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex flex-col items-center rounded-3xl bg-[#F8FBFD] p-5 md:w-64">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-32 w-32 rounded-[2rem] object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[#03357A] text-white">
                  <UserRound className="h-14 w-14" />
                </div>
              )}

              <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A]">
                <Camera className="h-4 w-4" />
                Changer la photo
                <input
                  type="file"
                  name="avatar"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </label>

              <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500">
                JPG, PNG ou WEBP. Maximum 5 Mo.
              </p>
            </div>

            <div className="grid flex-1 gap-4">
              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Nom complet
                </span>
                <input
                  name="full_name"
                  defaultValue={displayName}
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Email
                </span>
                <input
                  value={email}
                  readOnly
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-slate-50 px-4 text-sm font-bold text-slate-500 outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Téléphone
                </span>
                <input
                  name="phone"
                  defaultValue={profile?.phone || ""}
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
                  placeholder="+243..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">Rôle</span>
                <input
                  value={profile?.role || "super_admin"}
                  readOnly
                  className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-slate-50 px-4 text-sm font-bold text-slate-500 outline-none"
                />
              </label>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
              >
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </SuperAdminShell>
  );
}
