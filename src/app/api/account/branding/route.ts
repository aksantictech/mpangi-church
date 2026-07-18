import { NextResponse } from "next/server";

import { getCurrentChurchBranding } from "@/lib/tenant/churchBranding";

export const dynamic =
  "force-dynamic";

export async function GET() {
  const branding =
    await getCurrentChurchBranding();

  return NextResponse.json(
    {
      branding,
    },
    {
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
      },
    }
  );
}