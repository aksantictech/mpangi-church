import {
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTenantSubdomainFromHost,
} from "@/lib/tenant/domain";

export const dynamic =
  "force-dynamic";

type ManifestRouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

type ChurchManifestRow = {
  id: string;
  name: string | null;
  public_name: string | null;
  pwa_name: string | null;
  pwa_short_name: string | null;
  public_slogan: string | null;
  slug: string | null;
  subdomain: string | null;
  status: string | null;
  public_enabled: boolean | null;
  theme_color: string | null;
  background_color: string | null;
  updated_at: string | null;
  customization_updated_at:
    | string
    | null;
};

function cleanText(
  value: string | null | undefined,
  fallback = ""
) {
  const text = String(
    value || ""
  ).trim();

  return text || fallback;
}

function safeColor(
  value: string | null | undefined,
  fallback: string
) {
  const color =
    cleanText(value);

  return /^#[0-9A-Fa-f]{6}$/.test(
    color
  )
    ? color.toUpperCase()
    : fallback;
}

function getShortName(
  church: ChurchManifestRow,
  appName: string,
  slug: string
) {
  const configured =
    cleanText(
      church.pwa_short_name
    );

  if (configured) {
    return configured.slice(
      0,
      28
    );
  }

  if (
    slug ===
    "maison-misericorde-cmp"
  ) {
    return "MDM";
  }

  if (slug === "iccrdc") {
    return "ICC RDC";
  }

  if (
    /maison.*mis[eé]ricorde/i.test(
      appName
    )
  ) {
    return "MDM";
  }

  if (
    /impact.*centre.*chr[eé]tien.*rdc/i.test(
      appName
    )
  ) {
    return "ICC RDC";
  }

  if (
    /impact.*centre.*chr[eé]tien/i.test(
      appName
    )
  ) {
    return "ICC";
  }

  return (
    appName.slice(0, 28) ||
    "Église"
  );
}

function getManifestPaths(
  request: Request,
  slug: string
) {
  const requestUrl =
    new URL(request.url);

  const hostname =
    requestUrl.hostname
      .trim()
      .toLowerCase();

  const tenantSubdomain =
    getTenantSubdomainFromHost(
      hostname
    );

  const isTenantDomain =
    Boolean(tenantSubdomain);

  if (isTenantDomain) {
    return {
      startUrl: "/",
      scope: "/",
    };
  }

  const churchPath =
    `/church/${slug}`;

  return {
    startUrl: churchPath,
    scope: `${churchPath}/`,
  };
}

export async function GET(
  request: Request,
  { params }: ManifestRouteParams
) {
  const { slug: rawSlug } =
    await params;

  const slug =
    cleanText(rawSlug);

  if (!slug) {
    return NextResponse.json(
      {
        error:
          "Église introuvable.",
      },
      {
        status: 404,
      }
    );
  }

  const admin =
    createAdminClient();

  const {
    data,
    error,
  } = await admin
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      pwa_name,
      pwa_short_name,
      public_slogan,
      slug,
      subdomain,
      status,
      public_enabled,
      theme_color,
      background_color,
      updated_at,
      customization_updated_at
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  const church =
    data as
      | ChurchManifestRow
      | null;

  if (
    error ||
    !church ||
    church.status !== "active" ||
    church.public_enabled === false
  ) {
    return NextResponse.json(
      {
        error:
          "Manifest de l’église introuvable.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  }

  const finalSlug =
    cleanText(
      church.slug,
      slug
    );

  const publicName =
    cleanText(
      church.public_name
    ) ||
    cleanText(church.name) ||
    "Mpangi-church";

  const appName =
    cleanText(
      church.pwa_name
    ) ||
    publicName;

  const appShortName =
    getShortName(
      church,
      appName,
      finalSlug
    );

  const description =
    cleanText(
      church.public_slogan
    ) ||
    `Application officielle de ${publicName}`;

  const themeColor =
    safeColor(
      church.theme_color,
      "#03357A"
    );

  const backgroundColor =
    safeColor(
      church.background_color,
      "#F5F9FC"
    );

  const versionSource =
    church.customization_updated_at ||
    church.updated_at ||
    "1";

  const version =
    encodeURIComponent(
      versionSource
    );

  const origin =
    new URL(request.url).origin;

  const encodedSlug =
    encodeURIComponent(
      finalSlug
    );

  const iconUrl =
    `${origin}/api/pwa/icon?slug=${encodedSlug}&v=${version}`;

  const {
    startUrl,
    scope,
  } = getManifestPaths(
    request,
    finalSlug
  );

  const manifest = {
    id:
      `/church/${finalSlug}`,

    name: appName,

    short_name:
      appShortName,

    description,

    start_url:
      startUrl,

    scope,

    display:
      "standalone",

    display_override: [
      "window-controls-overlay",
      "standalone",
      "minimal-ui",
    ],

    orientation:
      "portrait-primary",

    background_color:
      backgroundColor,

    theme_color:
      themeColor,

    categories: [
      "productivity",
      "lifestyle",
      "social",
    ],

    icons: [
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconUrl,
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

        Vary:
          "Host",
      },
    }
  );
}