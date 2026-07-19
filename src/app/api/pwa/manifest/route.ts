import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ChurchIdentity = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type ChurchQueryResult = {
  data: ChurchIdentity | null;
  error: unknown;
};

function cleanHost(value: string) {
  return value.split(":")[0].trim().toLowerCase();
}

function getSubdomain(host: string) {
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "mpangi-church.app" ||
    host === "www.mpangi-church.app"
  ) {
    return "";
  }

  if (host.endsWith(".mpangi-church.app")) {
    return host.replace(".mpangi-church.app", "");
  }

  return "";
}

async function findChurch(host: string): Promise<ChurchIdentity | null> {
  const admin = createAdminClient();
  const subdomain = getSubdomain(host);

  const attempts: Array<() => Promise<ChurchQueryResult>> = [
    async () =>
      await admin
        .from("churches")
        .select("id, name, slug, logo_url")
        .eq("custom_domain", host)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("id, name, slug, logo_url")
        .eq("domain", host)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("id, name, slug, logo_url")
        .eq("subdomain", subdomain)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("id, name, slug, logo_url")
        .eq("slug", subdomain)
        .maybeSingle(),
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();

      if (!error && data) {
        return data;
      }
    } catch {
      // Colonne absente ou requête non applicable.
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const requestedHost =
    request.nextUrl.searchParams.get("host") ||
    request.headers.get("host") ||
    "mpangi-church.app";

  const host = cleanHost(requestedHost);
  const church = await findChurch(host);

  const name = church?.name || "Mpangi-church";
  const shortName = church?.name || "Mpangi";

  const manifest = {
    id: church ? `/${church.slug}` : "/",
    name,
    short_name: shortName.slice(0, 28),
    description: church
      ? `Application officielle de ${church.name}`
      : "Plateforme multi-églises Mpangi-church",
    start_url: church ? "/dashboard" : "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F5F9FC",
    theme_color: "#03357A",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/api/pwa/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/api/pwa/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
