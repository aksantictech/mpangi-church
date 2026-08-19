import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/members",
  "/attendance",
  "/souls",
  "/departments",
  "/events",
  "/reports",
  "/settings",
  "/profile",
  "/finance",
  "/patrimony",
  "/administration",
  "/notifications",
  "/my-work",
];

function firstHeader(request: Request, name: string) {
  return request.headers.get(name)?.split(",")[0]?.trim() || null;
}

function decodeGeo(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function classifyArea(path: string) {
  if (path === "/login" || path.startsWith("/login/")) return "login";
  if (PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return "authenticated";
  }
  return "public";
}

function referrerHost(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.slice(0, 180);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const path = String(body.path || "").trim();

  if (!path.startsWith("/") || path.length > 400) {
    return NextResponse.json({ error: "Chemin invalide." }, { status: 400 });
  }

  if (path.startsWith("/super-admin") || path.startsWith("/api/")) {
    return new NextResponse(null, { status: 204 });
  }

  const host =
    firstHeader(request, "x-forwarded-host") ||
    firstHeader(request, "host") ||
    "unknown";

  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(host.split(":")[0])) {
    return new NextResponse(null, { status: 204 });
  }

  const ip =
    firstHeader(request, "x-vercel-forwarded-for") ||
    firstHeader(request, "x-forwarded-for") ||
    firstHeader(request, "x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const isBot = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|headless/i.test(
    userAgent
  );

  const salt =
    process.env.ANALYTICS_HASH_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "mpangi-analytics";
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHmac("sha256", salt)
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex");

  const { error } = await createAdminClient().from("site_analytics_events").insert({
    event_type: "page_view",
    host: host.slice(0, 255),
    path: path.slice(0, 400),
    area: classifyArea(path),
    visitor_hash: visitorHash,
    country_code: firstHeader(request, "x-vercel-ip-country"),
    region: decodeGeo(firstHeader(request, "x-vercel-ip-country-region")),
    city: decodeGeo(firstHeader(request, "x-vercel-ip-city")),
    referrer_host: referrerHost(body.referrer),
    is_bot: isBot,
  });

  if (error) {
    console.error("Analytics page-view write failed", error.message);
  }

  return new NextResponse(null, { status: 204 });
}
