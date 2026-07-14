import { NextRequest, NextResponse } from "next/server";
import {
  apiBibleFetch,
  BibleBook,
  isSafeBibleIdentifier,
} from "@/lib/bible/apiBible";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const bibleId = request.nextUrl.searchParams.get("bibleId")?.trim() || "";

  if (!bibleId || !isSafeBibleIdentifier(bibleId)) {
    return NextResponse.json(
      { error: "Identifiant de version biblique invalide." },
      { status: 400 }
    );
  }

  try {
    const response = await apiBibleFetch<BibleBook[]>(
      `/bibles/${encodeURIComponent(
        bibleId
      )}/books?include-chapters=true`,
      { revalidate: 21600 }
    );

    return NextResponse.json(
      {
        data: response.data || [],
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Impossible de charger les livres.",
      },
      { status: 503 }
    );
  }
}
