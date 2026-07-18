import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveTenantPwaData,
} from "@/lib/tenant/pwa";

export const dynamic =
  "force-dynamic";

function cleanHost(value: string) {
  return String(value || "")
    .split(":")[0]
    .trim()
    .toLowerCase();
}

export async function GET(
  request: NextRequest
) {
  const requestedHost =
    request.nextUrl.searchParams.get(
      "host"
    ) ||
    request.headers.get(
      "x-forwarded-host"
    ) ||
    request.headers.get("host") ||
    "mpangi-church.app";

  const host =
    cleanHost(requestedHost);

  const tenant =
    await resolveTenantPwaData(
      host
    );

  const hasTenant =
    Boolean(tenant.church);

  const startUrl = hasTenant
    ? "/dashboard"
    : "/";

  const iconVersion =
    encodeURIComponent(
      tenant.version
    );

  const manifest = {
    id: hasTenant
      ? `/tenant/${tenant.slug}`
      : "/mpangi-church",

    name: tenant.appName,

    short_name:
      tenant.shortName,

    description:
      tenant.description,

    start_url: startUrl,

    scope: "/",

    display: "standalone",

    display_override: [
      "window-controls-overlay",
      "standalone",
      "minimal-ui",
    ],

    orientation:
      "portrait-primary",

    background_color:
      tenant.backgroundColor,

    theme_color:
      tenant.themeColor,

    categories: [
      "productivity",
      "lifestyle",
      "social",
    ],

    icons: [
      {
        src:
          `/api/pwa/icon/192?v=${iconVersion}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src:
          `/api/pwa/icon/192?v=${iconVersion}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src:
          `/api/pwa/icon/512?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src:
          `/api/pwa/icon/512?v=${iconVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return NextResponse.json(
    manifest,
    {
      headers: {
        "Content-Type":
          "application/manifest+json; charset=utf-8",
        "Cache-Control":
          "no-store, max-age=0",
        Vary: "Host",
      },
    }
  );
}