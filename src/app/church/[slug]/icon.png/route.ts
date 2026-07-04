import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("logo_url")
    .eq("slug", slug)
    .maybeSingle();

  const fallbackUrl = new URL("/images/mpangi-logo.png", request.url);

  if (!church?.logo_url) {
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    const imageResponse = await fetch(church.logo_url, {
      cache: "no-store",
    });

    if (!imageResponse.ok) {
      return NextResponse.redirect(fallbackUrl);
    }

    const contentType =
      imageResponse.headers.get("content-type") || "image/png";

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}