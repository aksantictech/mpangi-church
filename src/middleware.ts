import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIMARY_HOSTS = new Set([
  "mpangi-church.app",
  "www.mpangi-church.app",
  "localhost",
  "127.0.0.1",
]);

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/logout",
  "/install",
  "/offline",
  "/unauthorized",
  "/main-domain-required",
  "/church",
];

const PRIVATE_CHURCH_PREFIXES = [
  "/dashboard",
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
  "/settings",
  "/notifications",
  "/profile",
];

const PUBLIC_FILE_REGEX =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|webmanifest)$/i;

function getHost(request: NextRequest) {
  return (request.headers.get("host") || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function isPrimaryDomain(host: string) {
  if (PRIMARY_HOSTS.has(host)) return true;

  // Vercel preview/development domains behave like the main domain.
  if (host.endsWith(".vercel.app")) return true;

  return false;
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
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;

  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return false;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function isChurchPrivateRoute(pathname: string) {
  return startsWithAny(pathname, PRIVATE_CHURCH_PREFIXES);
}

function isSuperAdminRoute(pathname: string) {
  return pathname === "/super-admin" || pathname.startsWith("/super-admin/");
}

function isApiRoute(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function redirect(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url);
}

async function getUser(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = getHost(request);
  const primaryDomain = isPrimaryDomain(host);

  const response = NextResponse.next({
    request,
  });

  if (isPublicAsset(pathname)) return response;

  // Les routes API gardent leur propre sécurité dans leurs handlers.
  if (isApiRoute(pathname)) return response;

  // Sécurité critique :
  // Le domaine principal ne doit jamais ouvrir directement un dashboard église.
  if (primaryDomain && isChurchPrivateRoute(pathname)) {
    return redirect(request, "/main-domain-required", {
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
    return redirect(request, "/login", {
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
