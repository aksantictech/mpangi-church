import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, QrCode } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberRegistrationLinkCard from "@/components/settings/MemberRegistrationLinkCard";
import { createClient } from "@/lib/supabase/server";

export default async function MemberRegistrationSettingsPage() {
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

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      slug,
      member_form_enabled,
      member_form_token
    `
    )
    .eq("id", profile.church_id)
    .maybeSingle();

  if (!church) {
    redirect("/settings");
  }

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
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <QrCode className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                QR Code membre
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Lien public d’ajout membre
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Gérez le QR Code et le lien public permettant aux serviteurs de
                remplir leur fiche membre sans compte admin.
              </p>
            </div>
          </div>
        </section>

        <MemberRegistrationLinkCard church={church as any} />
      </div>
    </AppShell>
  );
}