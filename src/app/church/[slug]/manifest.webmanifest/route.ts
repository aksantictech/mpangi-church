import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ManifestRouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

function shortName(name: string) {
  const normalized = name.trim();

  if (!normalized) return "Église";

  if (/maison.*miséricorde|maison.*misericorde/i.test(normalized)) {
    return "MDM";
  }

  if (/impact.*centre.*chr[eé]tien.*rdc/i.test(normalized)) {
    return "ICC RDC";
  }

  if (/impact.*centre.*chr[eé]tien/i.test(normalized)) {
    return "ICC";
  }

  return normalized.length > 12 ? normalized.slice(0, 12) : normalized;
}

export async function GET(request: Request, { params }: ManifestRouteParams) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("name, public_name, slug, theme_color, background_color")
    .eq("slug", slug)
    .maybeSingle();

  const publicName =
    church?.public_name?.trim() ||
    church?.name?.trim() ||
    "Mpangi-church";

  const origin = new URL(request.url).origin;
  const iconUrl = `${origin}/church/${slug}/icon.png?v=${Date.now()}`;

  const manifest = {
    name: publicName,
    short_name: shortName(publicName),
    description: `Application officielle de ${publicName}`,
    start_url: `/church/${slug}`,
    scope: `/church/${slug}`,
    display: "standalone",
    orientation: "portrait",
    background_color: church?.background_color || "#F5F9FC",
    theme_color: church?.theme_color || "#03357A",
    icons: [
      {
        src: iconUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
