import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type IconRouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

async function fetchArrayBuffer(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = await response.arrayBuffer();

  return {
    buffer,
    contentType,
  };
}

export async function GET(_request: Request, { params }: IconRouteParams) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("logo_url")
    .eq("slug", slug)
    .maybeSingle();

  const logoUrl = church?.logo_url || "";

  if (logoUrl) {
    const result = await fetchArrayBuffer(logoUrl);

    if (result) {
      return new NextResponse(result.buffer, {
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=300, must-revalidate",
        },
      });
    }
  }

  const fallback = await fetchArrayBuffer(
    new URL("/icons/icon-512x512.png", _request.url).toString()
  );

  if (fallback) {
    return new NextResponse(fallback.buffer, {
      headers: {
        "Content-Type": fallback.contentType,
        "Cache-Control": "public, max-age=300, must-revalidate",
      },
    });
  }

  return NextResponse.json(
    { error: "Icône introuvable." },
    { status: 404 }
  );
}
