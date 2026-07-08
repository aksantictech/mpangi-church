import { createAdminClient } from "@/lib/supabase/admin";

const SUBDOMAIN_TO_SLUG: Record<string, string> = {
  mdm: "maison-misericorde-cmp",
  icckinshasa: "iccrdc",
  iccrdc: "iccrdc",
};

function normalizeHost(host: string) {
  return host
    .split(":")[0]
    .trim()
    .toLowerCase();
}

export function getSlugFromHost(host: string) {
  const cleanHost = normalizeHost(host);

  if (!cleanHost) return "";

  const firstPart = cleanHost.split(".")[0] || "";

  if (SUBDOMAIN_TO_SLUG[firstPart]) {
    return SUBDOMAIN_TO_SLUG[firstPart];
  }

  if (
    firstPart &&
    !["www", "mpangi-church", "localhost", "127"].includes(firstPart)
  ) {
    return firstPart;
  }

  return "";
}

function getShortName(name: string, slug: string) {
  const cleanName = String(name || "").trim();

  if (slug === "maison-misericorde-cmp") return "MDM";
  if (slug === "iccrdc") return "ICC RDC";
  if (/maison.*mis[eé]ricorde/i.test(cleanName)) return "MDM";
  if (/impact.*centre.*chr[eé]tien.*rdc/i.test(cleanName)) return "ICC RDC";
  if (/impact.*centre.*chr[eé]tien/i.test(cleanName)) return "ICC";

  if (!cleanName) return "Église";

  return cleanName.length > 12 ? cleanName.slice(0, 12) : cleanName;
}

export type TenantPwaChurch = {
  id: string;
  name: string;
  public_name?: string | null;
  slug: string;
  logo_url?: string | null;
  theme_color?: string | null;
  background_color?: string | null;
  updated_at?: string | null;
};

export type TenantPwaData = {
  host: string;
  slug: string;
  church: TenantPwaChurch | null;
  appName: string;
  shortName: string;
  logoUrl: string;
  themeColor: string;
  backgroundColor: string;
  version: string;
};

export async function resolveTenantPwaData(host: string): Promise<TenantPwaData> {
  const cleanHost = normalizeHost(host);
  const slug = getSlugFromHost(cleanHost);
  const admin = createAdminClient();

  let church: TenantPwaChurch | null = null;

  if (slug) {
    const { data } = await admin
      .from("churches")
      .select(
        "id, name, public_name, slug, logo_url, theme_color, background_color, updated_at"
      )
      .eq("slug", slug)
      .maybeSingle();

    church = data ?? null;
  }

  const appName =
    church?.public_name?.trim() ||
    church?.name?.trim() ||
    "Mpangi-church";

  const finalSlug = church?.slug || slug || "mpangi-church";

  return {
    host: cleanHost,
    slug: finalSlug,
    church,
    appName,
    shortName: getShortName(appName, finalSlug),
    logoUrl: church?.logo_url || "",
    themeColor: church?.theme_color || "#03357A",
    backgroundColor: church?.background_color || "#F5F9FC",
    version: church?.updated_at
      ? encodeURIComponent(church.updated_at)
      : String(Date.now()),
  };
}
