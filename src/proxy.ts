import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getTenantSubdomainFromHost,
  isPrimaryHostname,
  slugFromSubdomain,
} from "@/lib/tenant/domain";


const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/install",
  "/offline",
  "/unauthorized",
  "/main-domain-required",
  "/church-not-found",
  "/church",
];

const PRIVATE_CHURCH_PREFIXES = [
  "/dashboard",
  "/modules",
  "/my-work",
  "/members",
  "/attendance",
  "/souls",
  "/departments",
  "/events",
  "/publications",
  "/teachings",
  "/appointments",
  "/testimonies",
  "/public-requests",
  "/extensions",
  "/finance",
  "/patrimony",
  "/administration",
  "/inbox",
  "/settings",
  "/notifications",
  "/profile",
];

const TENANT_PUBLIC_PATHS = new Set([
  "/",
  "/prayer",
  "/appointment",
  "/join",
  "/testimony",
  "/bible",
  "/don",
  "/public-notifications",
  "/public-teachings",
]);

const PUBLIC_FILE_REGEX =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|webmanifest)$/i;

const tenantCache = new Map<
  string,
  { slug: string; expiresAt: number }
>();

function getHost(request: NextRequest) {
  return (request.headers.get("host") || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function isLocalDevelopmentHost(hostname: string) {
  const host = hostname.trim().toLowerCase();

  return (
    process.env.NODE_ENV === "development" &&
    (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0"
    )
  );
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/manifest") ||
    PUBLIC_FILE_REGEX.test(pathname)
  );
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;

  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return false;

    return (
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  });
}

function isChurchPrivateRoute(pathname: string) {
  return startsWithAny(pathname, PRIVATE_CHURCH_PREFIXES);
}

function isSuperAdminRoute(pathname: string) {
  return (
    pathname === "/super-admin" ||
    pathname.startsWith("/super-admin/")
  );
}

function isApiRoute(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string>,
  forcePrimaryDomain = false
) {
  const url = request.nextUrl.clone();

  if (forcePrimaryDomain) {
    url.protocol = "https:";
    url.host =
      process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() ||
      "mpangi-church.app";
  }

  url.pathname = pathname;
  url.search = "";

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url);
}

function rewriteTo(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.rewrite(url, {
    request: {
      headers: request.headers,
    },
  });
}

async function getUser(
  request: NextRequest,
  response: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function resolveTenantSlug(subdomain: string) {
  const knownSlug = slugFromSubdomain(subdomain);

  if (knownSlug !== subdomain) return knownSlug;

  const cached = tenantCache.get(subdomain);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.slug;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return knownSlug;

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  try {
    const bySubdomain = await fetch(
      `${supabaseUrl}/rest/v1/churches?select=slug&subdomain=eq.${encodeURIComponent(
        subdomain
      )}&status=neq.archived&limit=1`,
      {
        headers,
        next: { revalidate: 300 },
      }
    );

    if (bySubdomain.ok) {
      const rows = (await bySubdomain.json()) as Array<{
        slug?: string;
      }>;
      const slug = rows[0]?.slug?.trim();

      if (slug) {
        tenantCache.set(subdomain, {
          slug,
          expiresAt: Date.now() + 300_000,
        });

        return slug;
      }
    }

    const bySlug = await fetch(
      `${supabaseUrl}/rest/v1/churches?select=slug&slug=eq.${encodeURIComponent(
        knownSlug
      )}&status=neq.archived&limit=1`,
      {
        headers,
        next: { revalidate: 300 },
      }
    );

    if (bySlug.ok) {
      const rows = (await bySlug.json()) as Array<{
        slug?: string;
      }>;
      const slug = rows[0]?.slug?.trim();

      if (slug) return slug;
    }
  } catch {
    // Le fallback sur le slug garde le site accessible.
  }

  return knownSlug;
}

function canonicalTenantPath(
  pathname: string,
  tenantSlug: string
) {
  const technicalPrefix = `/church/${tenantSlug}`;

  if (pathname === technicalPrefix) return "/";

  if (pathname.startsWith(`${technicalPrefix}/`)) {
    const suffix = pathname.slice(technicalPrefix.length) || "/";

    if (suffix === "/notifications") {
      return "/public-notifications";
    }

    if (suffix === "/teachings") {
      return "/public-teachings";
    }

    if (suffix.startsWith("/teachings/")) {
      return suffix.replace(
        "/teachings/",
        "/public-teachings/"
      );
    }

    return suffix;
  }

  return null;
}

function tenantInternalPath(pathname: string, tenantSlug: string) {
  if (pathname === "/") return `/church/${tenantSlug}`;

  const firstSegment = `/${pathname.split("/").filter(Boolean)[0] || ""}`;

  if (firstSegment === "/public-notifications") {
    return `/church/${tenantSlug}${pathname.replace(
      "/public-notifications",
      "/notifications"
    )}`;
  }

  if (firstSegment === "/public-teachings") {
    return `/church/${tenantSlug}${pathname.replace(
      "/public-teachings",
      "/teachings"
    )}`;
  }

  if (TENANT_PUBLIC_PATHS.has(firstSegment)) {
    return `/church/${tenantSlug}${pathname}`;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = getHost(request);
  const primaryDomain = isPrimaryHostname(host);
  const subdomain = getTenantSubdomainFromHost(host);
const localDevelopment =
  isLocalDevelopmentHost(host);
  const response = NextResponse.next({ request });

  if (isPublicAsset(pathname)) return response;
  if (isApiRoute(pathname)) return response;

  if (!primaryDomain && subdomain) {
    const tenantSlug = await resolveTenantSlug(subdomain);

    if (isSuperAdminRoute(pathname)) {
      return redirectTo(
        request,
        pathname,
        undefined,
        true
      );
    }

    const canonicalPath = canonicalTenantPath(
      pathname,
      tenantSlug
    );

    if (canonicalPath) {
      return redirectTo(request, canonicalPath);
    }

    if (
      pathname === "/login" &&
      request.nextUrl.searchParams.has("church")
    ) {
      return redirectTo(request, "/login");
    }

    if (pathname === "/login") {
      return rewriteTo(request, "/login", {
        church: tenantSlug,
      });
    }

    const internalPublicPath = tenantInternalPath(
      pathname,
      tenantSlug
    );

    if (internalPublicPath) {
      return rewriteTo(request, internalPublicPath);
    }
  }

  if (
  !localDevelopment &&
  primaryDomain &&
  isChurchPrivateRoute(pathname)
) {
    return redirectTo(request, "/main-domain-required", {
      reason: "tenant_domain_required",
      next: pathname,
    });
  }

  const needsAuth =
    isSuperAdminRoute(pathname) ||
    (!isPublicRoute(pathname) && isChurchPrivateRoute(pathname)) ||
    (!primaryDomain && isChurchPrivateRoute(pathname));

  if (!needsAuth) return response;

  const user = await getUser(request, response);

  if (!user) {
    return redirectTo(request, "/login", {
      next: pathname,
      reason: "auth_required",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
