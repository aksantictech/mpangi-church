import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveTenantPwaData } from "@/lib/tenant/pwa";

export const dynamic = "force-dynamic";

async function buildManifest() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "";

  const tenant = await resolveTenantPwaData(host);
  const iconSrc = `/api/pwa/icon?slug=${encodeURIComponent(
    tenant.slug
  )}&v=${encodeURIComponent(tenant.version)}`;

  return {
    name: tenant.appName,
    short_name: tenant.shortName,
    description: `Application officielle ${tenant.appName}`,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: tenant.backgroundColor,
    theme_color: tenant.themeColor,
    icons: [
      {
        src: iconSrc,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export async function GET() {
  return NextResponse.json(await buildManifest(), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
