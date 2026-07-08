import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ManifestRouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

function shortName(name: string, slug: string) {
  const cleanName = String(name || "").trim();

  if (slug === "maison-misericorde-cmp") return "MDM";
  if (slug === "iccrdc") return "ICC RDC";
  if (/maison.*mis[eé]ricorde/i.test(cleanName)) return "MDM";
  if (/impact.*centre.*chr[eé]tien.*rdc/i.test(cleanName)) return "ICC RDC";
  if (/impact.*centre.*chr[eé]tien/i.test(cleanName)) return "ICC";

  if (!cleanName) return "Église";

  return cleanName.length > 12 ? cleanName.slice(0, 12) : cleanName;
}

export async function GET(request: Request, { params }: ManifestRouteParams) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("name, public_name, slug, theme_color, background_color, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  const publicName =
    church?.public_name?.trim() ||
    church?.name?.trim() ||
    "Mpangi-church";

  const origin = new URL(request.url).origin;
  const version = church?.updated_at
    ? encodeURIComponent(church.updated_at)
    : String(Date.now());

  const iconUrl = `${origin}/api/pwa/icon?slug=${encodeURIComponent(
    slug
  )}&v=${version}`;

  const manifest = {
    name: publicName,
    short_name: shortName(publicName, slug),
    description: `Application officielle ${publicName}`,
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
