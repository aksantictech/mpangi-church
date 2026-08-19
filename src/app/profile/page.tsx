import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import ProfileFormClient from "./ProfileFormClient";

export default async function ChurchProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Impossible de charger le profil: ${profileError.message}`);
  }

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Utilisateur";

  const email = profile?.email || user.email || "";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Mon compte
          </p>
          <h1 className="mt-3 text-3xl font-black">Modifier mon profil</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Mettez à jour votre nom, téléphone et photo de profil.
          </p>
        </section>

        <ProfileFormClient
          initialProfile={{
            fullName: displayName,
            email,
            phone: profile?.phone || "",
            avatarUrl:
              profile?.avatar_url ||
              String(user.user_metadata?.avatar_url || ""),
            role: profile?.role || "Utilisateur",
          }}
        />
      </div>
    </AppShell>
  );
}
