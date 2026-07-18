import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ChurchBranding = {
  churchId: string | null;
  name: string;
  shortName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  welcomeMessage: string | null;
};

const DEFAULT_BRANDING: ChurchBranding = {
  churchId: null,
  name: "Mpangi-church",
  shortName: "MC",
  logoUrl: null,
  primaryColor: "#03357A",
  secondaryColor: "#2563EB",
  accentColor: "#8B5CF6",
  backgroundColor: "#F5F9FC",
  surfaceColor: "#FFFFFF",
  textColor: "#0F172A",
  welcomeMessage: null,
};

type ChurchBrandingRow = {
  id: string;
  name: string | null;
  public_name: string | null;
  pwa_name: string | null;
  pwa_short_name: string | null;
  logo_url: string | null;
  theme_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  surface_color: string | null;
  text_color: string | null;
  dashboard_welcome_message: string | null;
};

function validColor(
  value: string | null | undefined,
  fallback: string
) {
  const color = String(value || "").trim();

  return /^#[0-9a-f]{6}$/i.test(color)
    ? color
    : fallback;
}

function createShortName(
  value: string | null | undefined
) {
  const name = String(value || "").trim();

  if (!name) return DEFAULT_BRANDING.shortName;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || DEFAULT_BRANDING.shortName;
}

export async function getCurrentChurchBranding(): Promise<ChurchBranding> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return DEFAULT_BRANDING;
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("church_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.church_id) {
      return DEFAULT_BRANDING;
    }

    const { data } = await admin
      .from("churches")
      .select(
        `
          id,
          name,
          public_name,
          pwa_name,
          pwa_short_name,
          logo_url,
          theme_color,
          secondary_color,
          accent_color,
          background_color,
          surface_color,
          text_color,
          dashboard_welcome_message
        `
      )
      .eq("id", profile.church_id)
      .maybeSingle();

    if (!data) {
      return DEFAULT_BRANDING;
    }

    const church = data as ChurchBrandingRow;

    const name =
      church.pwa_name?.trim() ||
      church.public_name?.trim() ||
      church.name?.trim() ||
      DEFAULT_BRANDING.name;

    return {
      churchId: church.id,
      name,
      shortName:
        church.pwa_short_name?.trim() ||
        createShortName(name),
      logoUrl: church.logo_url?.trim() || null,
      primaryColor: validColor(
        church.theme_color,
        DEFAULT_BRANDING.primaryColor
      ),
      secondaryColor: validColor(
        church.secondary_color,
        DEFAULT_BRANDING.secondaryColor
      ),
      accentColor: validColor(
        church.accent_color,
        DEFAULT_BRANDING.accentColor
      ),
      backgroundColor: validColor(
        church.background_color,
        DEFAULT_BRANDING.backgroundColor
      ),
      surfaceColor: validColor(
        church.surface_color,
        DEFAULT_BRANDING.surfaceColor
      ),
      textColor: validColor(
        church.text_color,
        DEFAULT_BRANDING.textColor
      ),
      welcomeMessage:
        church.dashboard_welcome_message?.trim() || null,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}