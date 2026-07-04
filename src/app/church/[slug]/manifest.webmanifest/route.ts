import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function getPublicChurchName(church: {
  name: string | null;
  public_name: string | null;
  pwa_name: string | null;
}) {
  const pwaName = church.pwa_name?.trim();

  if (pwaName) return pwaName;

  const publicName = church.public_name?.trim();

  if (publicName) return publicName;

  const name = church.name?.trim();

  if (!name) return "Mpangi-church";

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

function getShortName(church: {
  pwa_short_name: string | null;
  public_name: string | null;
  name: string | null;
}) {
  const shortName = church.pwa_short_name?.trim();

  if (shortName) return shortName.slice(0, 12);

  const publicName = church.public_name?.trim() || church.name?.trim();

  if (!publicName) return "Mpangi";

  return publicName
    .replace(/\s*[,|-]?\s*extension.*$/i, "")
    .trim()
    .slice(0, 12);
}

function isPlatformHost(host: string) {
  const normalizedHost = host.split(":")[0]?.toLowerCase() || "";

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "mpangi-church.app" ||
    normalizedHost === "www.mpangi-church.app" ||
    normalizedHost.endsWith(".vercel.app")
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      pwa_name,
      pwa_short_name,
      public_message,
      logo_url,
      slug,
      status,
      public_enabled
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!church || church.status !== "active" || !church.public_enabled) {
    return NextResponse.json(
      {
        error: "Église introuvable.",
      },
      { status: 404 }
    );
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const platformHost = isPlatformHost(host);

  const appName = getPublicChurchName(church);
  const shortName = getShortName(church);

  const startUrl = platformHost ? `/church/${slug}` : "/";
  const iconUrl = `/church/${slug}/icon.png`;

  return NextResponse.json(
    {
      name: appName,
      short_name: shortName,
      description:
        church.public_message ||
        `Application officielle de ${appName} propulsée par Mpangi-church.`,
      id: startUrl,
      start_url: startUrl,
      scope: "/",
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
      orientation: "portrait-primary",
      background_color: "#F5F9FC",
      theme_color: "#03357A",
      categories: ["productivity", "business", "lifestyle"],
      icons: [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
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
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-store",
      },
    }
  );
}