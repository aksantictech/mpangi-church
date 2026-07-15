import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTenantSubdomainFromHost,
  slugFromSubdomain,
} from "@/lib/tenant/domain";

function normalizeHost(host: string) {
  return host.split(":")[0].trim().toLowerCase();
}

export function getSlugFromHost(host: string) {
  const subdomain = getTenantSubdomainFromHost(host);

  return subdomain ? slugFromSubdomain(subdomain) : "";
}

function field(row: any, key: string, fallback = "") {
  const value = row?.[key];

  return typeof value === "string"
    ? value.trim() || fallback
    : fallback;
}

function getShortName(name: string, slug: string) {
  if (slug === "maison-misericorde-cmp") return "MDM";
  if (slug === "iccrdc") return "ICC RDC";
  if (/maison.*mis[eé]ricorde/i.test(name)) return "MDM";
  if (/impact.*centre.*chr[eé]tien.*rdc/i.test(name)) {
    return "ICC RDC";
  }
  if (/impact.*centre.*chr[eé]tien/i.test(name)) return "ICC";

  return name.length > 12
    ? name.slice(0, 12)
    : name || "Église";
}

export async function resolveTenantPwaData(host: string) {
  const cleanHost = normalizeHost(host);
  const subdomain = getTenantSubdomainFromHost(cleanHost);
  const fallbackSlug = subdomain
    ? slugFromSubdomain(subdomain)
    : "";
  const admin = createAdminClient();

  let church: any = null;

  if (subdomain) {
    const { data } = await admin
      .from("churches")
      .select("*")
      .eq("subdomain", subdomain)
      .maybeSingle();

    church = data ?? null;
  }

  if (!church && fallbackSlug) {
    const { data } = await admin
      .from("churches")
      .select("*")
      .eq("slug", fallbackSlug)
      .maybeSingle();

    church = data ?? null;
  }

  const finalSlug = field(
    church,
    "slug",
    fallbackSlug || "mpangi-church"
  );
  const appName =
    field(church, "public_name") ||
    field(church, "name") ||
    "Mpangi-church";

  return {
    host: cleanHost,
    subdomain,
    slug: finalSlug,
    church,
    appName,
    shortName: getShortName(appName, finalSlug),
    logoUrl: field(church, "logo_url"),
    themeColor: field(church, "theme_color", "#03357A"),
    backgroundColor: field(
      church,
      "background_color",
      "#F5F9FC"
    ),
    version:
      field(church, "updated_at") || String(Date.now()),
  };
}
