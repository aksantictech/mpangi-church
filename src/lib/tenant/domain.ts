const DEFAULT_ROOT_DOMAIN = "mpangi-church.app";

const SLUG_TO_SUBDOMAIN: Record<string, string> = {
  "maison-misericorde-cmp": "mdm",
  iccrdc: "icckinshasa",
};

const SUBDOMAIN_TO_SLUG: Record<string, string> = {
  mdm: "maison-misericorde-cmp",
  icckinshasa: "iccrdc",
  iccrdc: "iccrdc",
};

export type ChurchDomainInput = {
  slug?: string | null;
  subdomain?: string | null;
};

export function normalizeHostname(value: string) {
  return String(value || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

export function normalizeSubdomain(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

export function getRootDomain() {
  return (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase() ||
    DEFAULT_ROOT_DOMAIN
  );
}

export function getAppProtocol() {
  return process.env.NEXT_PUBLIC_APP_PROTOCOL?.trim() || "https";
}

export function isPrimaryHostname(hostname: string) {
  const host = normalizeHostname(hostname);
  const rootDomain = getRootDomain();

  return (
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app")
  );
}

export function getTenantSubdomainFromHost(hostname: string) {
  const host = normalizeHostname(hostname);
  const rootDomain = getRootDomain();

  if (isPrimaryHostname(host)) return "";

  if (host.endsWith(`.${rootDomain}`)) {
    return normalizeSubdomain(
      host.slice(0, -1 * (`.${rootDomain}`.length))
    );
  }

  return "";
}

export function slugFromSubdomain(subdomain: string) {
  const normalized = normalizeSubdomain(subdomain);

  return SUBDOMAIN_TO_SLUG[normalized] || normalized;
}

export function canonicalSubdomainForChurch(
  church: ChurchDomainInput
) {
  const explicit = normalizeSubdomain(church.subdomain || "");

  if (explicit) return explicit;

  const slug = normalizeSubdomain(church.slug || "");

  return SLUG_TO_SUBDOMAIN[slug] || slug;
}

function normalizePath(pathname: string) {
  const value = String(pathname || "/").trim();

  if (!value || value === "/") return "/";

  return value.startsWith("/") ? value : `/${value}`;
}

export function buildMainAppUrl(pathname = "/") {
  const path = normalizePath(pathname);
  const rootDomain = getRootDomain();

  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(
      normalizeHostname(window.location.hostname)
    )
  ) {
    return path;
  }

  return `${getAppProtocol()}://${rootDomain}${
    path === "/" ? "" : path
  }`;
}

export function buildChurchPublicUrl(
  church: ChurchDomainInput,
  pathname = "/"
) {
  const path = normalizePath(pathname);
  const slug = normalizeSubdomain(church.slug || "");
  const subdomain = canonicalSubdomainForChurch(church);

  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(
      normalizeHostname(window.location.hostname)
    )
  ) {
    return slug
      ? `/church/${slug}${path === "/" ? "" : path}`
      : path;
  }

  if (!subdomain) {
    return slug
      ? `${getAppProtocol()}://${getRootDomain()}/church/${slug}${
          path === "/" ? "" : path
        }`
      : buildMainAppUrl(path);
  }

  return `${getAppProtocol()}://${subdomain}.${getRootDomain()}${
    path === "/" ? "" : path
  }`;
}
