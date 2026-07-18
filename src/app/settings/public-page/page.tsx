import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PublicPageSettingsForm from "@/components/settings/PublicPageSettingsForm";
import { createClient } from "@/lib/supabase/server";
import AdvancedCustomizationForm from "@/components/settings/AdvancedCustomizationForm";

export default async function PublicPageSettingsPage() {
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
      public_name,
      pastor_name,
      pastor_title,
      phone,
      whatsapp,
      email,
      address,
      city,
      country,
      public_hero_title,
      public_message,
      service_times,
      youtube_channel_url,
      latest_video_url,
      news_title,
      news_description,
      donation_enabled,
      donation_message,
      donation_mobile_money,
      donation_mobile_money_name,
      donation_card_url,
      donation_bank_name,
      donation_bank_account_name,
      donation_bank_account_number,
      donation_bank_iban,
      donation_bank_swift,
            logo_url,
      cover_image_url,
      theme_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      pwa_name,
      pwa_short_name,
      public_slogan,
      public_layout,
      public_hero_style,
      dashboard_welcome_message,
      show_pastor,
      show_programs,
      show_publications,
      show_teachings,
      show_donations,
      customization_updated_at,
      donation_bank_details
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
              <Globe className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Page publique
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Configuration de la page publique
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Modifiez les informations visibles par les visiteurs de votre
                église.
              </p>
            </div>
          </div>
        </section>
<AdvancedCustomizationForm church={church} />
        <PublicPageSettingsForm church={church} />
      </div>
    </AppShell>
  );
}