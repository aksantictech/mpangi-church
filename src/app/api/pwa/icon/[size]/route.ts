import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type LogoQueryResult = {
  data: { logo_url: string | null } | null;
  error: unknown;
};

function cleanHost(value: string) {
  return value.split(":")[0].trim().toLowerCase();
}

function getSubdomain(host: string) {
  if (host.endsWith(".mpangi-church.app")) {
    return host.replace(".mpangi-church.app", "");
  }

  return "";
}

async function resolveLogoUrl(host: string) {
  const admin = createAdminClient();
  const subdomain = getSubdomain(host);

  const attempts: Array<() => Promise<LogoQueryResult>> = [
    async () =>
      await admin
        .from("churches")
        .select("logo_url")
        .eq("custom_domain", host)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("logo_url")
        .eq("domain", host)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("logo_url")
        .eq("subdomain", subdomain)
        .maybeSingle(),
    async () =>
      await admin
        .from("churches")
        .select("logo_url")
        .eq("slug", subdomain)
        .maybeSingle(),
  ];

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt();

      if (!error && data?.logo_url) {
        return String(data.logo_url);
      }
    } catch {
      // Essai suivant.
    }
  }

  return "";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ size: string }> }
) {
  const { size } = await context.params;
  const host = cleanHost(request.headers.get("host") || "");
  const churchLogo = await resolveLogoUrl(host);

  const fallbackUrl = new URL("/images/mpangi-logo.png", request.url);
  const sourceUrl = churchLogo || fallbackUrl.toString();

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(fallbackUrl);
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=3600",
        "X-PWA-Icon-Size": size,
      },
    });
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}
