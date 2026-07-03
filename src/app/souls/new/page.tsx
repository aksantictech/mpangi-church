import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import SoulFollowupForm from "@/components/souls/SoulFollowupForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewSoulFollowupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, first_name, middle_name, last_name, phone")
    .eq("church_id", profile.church_id)
    .eq("status", "actif")
    .order("first_name", { ascending: true });

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/souls"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au suivi des âmes
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <HeartHandshake className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Nouveau suivi pastoral
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Créer un suivi d’âme
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Ce suivi sera automatiquement rattaché à votre église.
              </p>
            </div>
          </div>
        </section>

        <SoulFollowupForm
          mode="create"
          churchId={profile.church_id}
          profileId={profile.id}
          members={(members ?? []) as any}
        />
      </div>
    </AppShell>
  );
}