import {
  getTenantSubdomainFromHost,
  slugFromSubdomain,
} from "@/lib/tenant/domain";
import { createAdminClient } from "@/lib/supabase/admin";

type ChurchPwaRow = {
  id: string;
  name: string | null;
  public_name: string | null;
  pwa_name: string | null;
  pwa_short_name: string | null;
  public_slogan: string | null;
  slug: string | null;
  subdomain: string | null;
  logo_url: string | null;
  theme_color: string | null;
  background_color: string | null;
  updated_at: string | null;
};

function normalizeHost(host: string) {
  return String(host || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function cleanText(
  value: string | null | undefined,
  fallback = ""
) {
  const text = String(
    value || ""
  ).trim();

  return text || fallback;
}

function safeColor(
  value: string | null | undefined,
  fallback: string
) {
  const color = cleanText(value);

  return /^#[0-9A-Fa-f]{6}$/.test(
    color
  )
    ? color.toUpperCase()
    : fallback;
}

export function getSlugFromHost(
  host: string
) {
  const subdomain =
    getTenantSubdomainFromHost(
      normalizeHost(host)
    );

  return subdomain
    ? slugFromSubdomain(subdomain)
    : "";
}

function getShortName(
  church: ChurchPwaRow | null,
  appName: string,
  slug: string
) {
  const configuredName = cleanText(
    church?.pwa_short_name
  );

  if (configuredName) {
    return configuredName.slice(0, 28);
  }

  if (
    slug ===
    "maison-misericorde-cmp"
  ) {
    return "MDM";
  }

  if (slug === "iccrdc") {
    return "ICC RDC";
  }

  return (
    appName.slice(0, 28) ||
    "Mpangi"
  );
}

export async function resolveTenantPwaData(
  host: string
) {
  const cleanHost =
    normalizeHost(host);

  const subdomain =
    getTenantSubdomainFromHost(
      cleanHost
    );

  const fallbackSlug = subdomain
    ? slugFromSubdomain(subdomain)
    : "";

  const admin =
    createAdminClient();

  let church:
    | ChurchPwaRow
    | null = null;

  if (subdomain) {
    const { data } = await admin
      .from("churches")
      .select(
        `
        id,
        name,
        public_name,
        pwa_name,
        pwa_short_name,
        public_slogan,
        slug,
        subdomain,
        logo_url,
        theme_color,
        background_color,
        updated_at
      `
      )
      .eq("subdomain", subdomain)
      .maybeSingle();

    church =
      (data as ChurchPwaRow | null) ||
      null;
  }

  if (!church && fallbackSlug) {
    const { data } = await admin
      .from("churches")
      .select(
        `
        id,
        name,
        public_name,
        pwa_name,
        pwa_short_name,
        public_slogan,
        slug,
        subdomain,
        logo_url,
        theme_color,
        background_color,
        updated_at
      `
      )
      .eq("slug", fallbackSlug)
      .maybeSingle();

    church =
      (data as ChurchPwaRow | null) ||
      null;
  }

  const finalSlug = cleanText(
    church?.slug,
    fallbackSlug ||
      "mpangi-church"
  );

  const appName =
    cleanText(church?.pwa_name) ||
    cleanText(
      church?.public_name
    ) ||
    cleanText(church?.name) ||
    "Mpangi-church";

  return {
    host: cleanHost,
    subdomain,
    slug: finalSlug,
    church,
    appName,
    shortName: getShortName(
      church,
      appName,
      finalSlug
    ),
    description:
      cleanText(
        church?.public_slogan
      ) ||
      (church
        ? `Application officielle de ${appName}`
        : "Plateforme multi-églises Mpangi-church"),
    logoUrl: cleanText(
      church?.logo_url
    ),
    themeColor: safeColor(
      church?.theme_color,
      "#03357A"
    ),
    backgroundColor: safeColor(
      church?.background_color,
      "#F5F9FC"
    ),
    version:
      cleanText(
        church?.updated_at
      ) || "1",
  };
}