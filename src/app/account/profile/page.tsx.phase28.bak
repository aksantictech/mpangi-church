import { notFound } from "next/navigation";
import AccountPageShell from "@/components/account/AccountPageShell";
import ProfileSettingsForm from "@/components/account/ProfileSettingsForm";
import { createClient } from "@/lib/supabase/server";

export default async function AccountProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, email, phone, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  return (
    <AccountPageShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Mon compte
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Modifier mon profil
          </h1>

          <p className="mt-2 text-sm leading-7 text-blue-50">
            Gérez votre nom, vos contacts et votre photo de profil.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
          <ProfileSettingsForm
            profile={profile}
            authEmail={user.email ?? null}
          />
        </section>
      </div>
    </AccountPageShell>
  );
}