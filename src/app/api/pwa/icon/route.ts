import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSlugFromHost } from "@/lib/tenant/pwa";

export const dynamic = "force-dynamic";

async function fetchImage(url: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) return null;

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "image/png",
  };
}

async function fallbackIcon(request: Request) {
  const fallback = await fetchImage(
    new URL("/icons/icon-512x512.png", request.url).toString()
  );

  if (!fallback) {
    return NextResponse.json({ error: "Icône introuvable." }, { status: 404 });
  }

  return new NextResponse(fallback.buffer, {
    headers: {
      "Content-Type": fallback.contentType,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";

  const slug = url.searchParams.get("slug") || getSlugFromHost(host);

  if (!slug) return fallbackIcon(request);

  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const logoUrl =
    typeof church?.logo_url === "string" ? church.logo_url.trim() : "";

  if (!logoUrl) return fallbackIcon(request);

  const image = await fetchImage(logoUrl);

  if (!image) return fallbackIcon(request);

  return new NextResponse(image.buffer, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
