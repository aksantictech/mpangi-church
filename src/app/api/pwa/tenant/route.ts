import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveTenantPwaData } from "@/lib/tenant/pwa";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const tenant = await resolveTenantPwaData(host);
  return NextResponse.json({
    host: tenant.host,
    slug: tenant.slug,
    appName: tenant.appName,
    shortName: tenant.shortName,
    hasLogoUrl: Boolean(tenant.logoUrl),
    logoUrl: tenant.logoUrl,
    themeColor: tenant.themeColor,
    backgroundColor: tenant.backgroundColor,
    churchId: tenant.church?.id || null,
    churchName: tenant.church?.name || null,
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
