import { createAdminClient } from "@/lib/supabase/admin";

const SUBDOMAIN_TO_SLUG: Record<string, string> = {
  mdm: "maison-misericorde-cmp",
  icckinshasa: "iccrdc",
  iccrdc: "iccrdc",
};

function normalizeHost(host: string) {
  return host.split(":")[0].trim().toLowerCase();
}

export function getSlugFromHost(host: string) {
  const cleanHost = normalizeHost(host);
  const firstPart = cleanHost.split(".")[0] || "";

  if (SUBDOMAIN_TO_SLUG[firstPart]) return SUBDOMAIN_TO_SLUG[firstPart];

  if (
    firstPart &&
    !["www", "mpangi-church", "localhost", "127"].includes(firstPart)
  ) {
    return firstPart;
  }

  return "";
}

function field(row: any, key: string, fallback = "") {
  const value = row?.[key];

  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function getShortName(name: string, slug: string) {
  if (slug === "maison-misericorde-cmp") return "MDM";
  if (slug === "iccrdc") return "ICC RDC";
  if (/maison.*mis[eé]ricorde/i.test(name)) return "MDM";
  if (/impact.*centre.*chr[eé]tien.*rdc/i.test(name)) return "ICC RDC";
  if (/impact.*centre.*chr[eé]tien/i.test(name)) return "ICC";

  return name.length > 12 ? name.slice(0, 12) : name || "Église";
}

export async function resolveTenantPwaData(host: string) {
  const cleanHost = normalizeHost(host);
  const slug = getSlugFromHost(cleanHost);
  const admin = createAdminClient();

  let church: any = null;

  if (slug) {
    const { data } = await admin
      .from("churches")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    church = data ?? null;
  }

  const finalSlug = field(church, "slug", slug || "mpangi-church");
  const appName =
    field(church, "public_name") ||
    field(church, "name") ||
    "Mpangi-church";

  return {
    host: cleanHost,
    slug: finalSlug,
    church,
    appName,
    shortName: getShortName(appName, finalSlug),
    logoUrl: field(church, "logo_url"),
    themeColor: field(church, "theme_color", "#03357A"),
    backgroundColor: field(church, "background_color", "#F5F9FC"),
    version: field(church, "updated_at") || String(Date.now()),
  };
}
