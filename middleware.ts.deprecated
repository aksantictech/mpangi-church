import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

type TenantChurch = {
  slug: string;
};

const PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "mpangi-church.app",
  "www.mpangi-church.app",
]);

function normalizeHost(host: string) {
  return host.split(":")[0]?.toLowerCase().trim() || "";
}

function stripWww(host: string) {
  return host.startsWith("www.") ? host.slice(4) : host;
}

function isPlatformHost(host: string) {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) return true;

  if (PLATFORM_HOSTS.has(normalizedHost)) return true;

  if (normalizedHost.endsWith(".vercel.app")) return true;

  return false;
}

function getDomainCandidates(host: string) {
  const normalizedHost = normalizeHost(host);
  const withoutWww = stripWww(normalizedHost);

  return Array.from(
    new Set([
      normalizedHost,
      withoutWww,
      `www.${withoutWww}`,
    ].filter(Boolean))
  );
}

async function resolveChurchByDomain(host: string): Promise<TenantChurch | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  const candidates = getDomainCandidates(host);

  if (candidates.length === 0) return null;

  const params = new URLSearchParams();

  params.set("select", "slug");
  params.set("status", "eq.active");
  params.set("public_enabled", "eq.true");
  params.set("custom_domain_verified", "eq.true");
  params.set(
    "or",
    `(${candidates
      .map((domain) => `custom_domain.eq.${domain}`)
      .join(",")})`
  );
  params.set("limit", "1");

  const response = await fetch(
    `${supabaseUrl}/rest/v1/churches?${params.toString()}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const churches = (await response.json()) as TenantChurch[];

  return churches[0] || null;
}

async function handleCustomDomain(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (isPlatformHost(host)) {
    return null;
  }

  const tenantChurch = await resolveChurchByDomain(host);

  if (!tenantChurch?.slug) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/church/${tenantChurch.slug}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/install") {
    const url = request.nextUrl.clone();
    url.pathname = `/church/${tenantChurch.slug}/install`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/manifest.webmanifest") {
    const url = request.nextUrl.clone();
    url.pathname = `/church/${tenantChurch.slug}/manifest.webmanifest`;
    return NextResponse.rewrite(url);
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.searchParams.set("church", tenantChurch.slug);
    return NextResponse.rewrite(url);
  }

  if (
    pathname.startsWith("/church/") &&
    !pathname.startsWith(`/church/${tenantChurch.slug}`)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const tenantResponse = await handleCustomDomain(request);

  if (tenantResponse) {
    return tenantResponse;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/install",
    "/manifest.webmanifest",
    "/church/:path*",
    "/dashboard/:path*",
    "/members/:path*",
    "/attendance/:path*",
    "/departments/:path*",
    "/events/:path*",
    "/souls/:path*",
    "/public-requests/:path*",
    "/appointments/:path*",
    "/testimonies/:path*",
    "/settings/:path*",
    "/account/:path*",
  ],
};