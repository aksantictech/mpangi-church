import { NextRequest, NextResponse } from "next/server";
import {
  apiBibleFetch,
  BibleSearchVerse,
  isSafeBibleIdentifier,
  stripBibleHtml,
} from "@/lib/bible/apiBible";

export const dynamic = "force-dynamic";

type SearchResponse = {
  query?: string;
  limit?: number;
  offset?: number;
  total?: number;
  verseCount?: number;
  verses?: BibleSearchVerse[];
  passages?: BibleSearchVerse[];
};

export async function GET(request: NextRequest) {
  const bibleId = request.nextUrl.searchParams.get("bibleId")?.trim() || "";
  const searchQuery =
    request.nextUrl.searchParams.get("query")?.trim() || "";

  if (!bibleId || !isSafeBibleIdentifier(bibleId)) {
    return NextResponse.json(
      { error: "Identifiant de version biblique invalide." },
      { status: 400 }
    );
  }

  if (searchQuery.length < 2) {
    return NextResponse.json(
      { error: "Saisissez au moins deux caractères." },
      { status: 400 }
    );
  }

  const query = new URLSearchParams({
    query: searchQuery,
    limit: "30",
    offset: "0",
    sort: "relevance",
    "fums-version": "3",
  });

  try {
    const response = await apiBibleFetch<SearchResponse>(
      `/bibles/${encodeURIComponent(
        bibleId
      )}/search?${query.toString()}`,
      { revalidate: 0 }
    );

    const rawResults =
      response.data?.verses || response.data?.passages || [];

    const results = rawResults.map((item) => ({
      ...item,
      text: stripBibleHtml(item.text || ""),
    }));

    return NextResponse.json({
      data: results,
      total:
        response.data?.total ||
        response.data?.verseCount ||
        results.length,
      fumsToken: response.meta?.fumsToken || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "La recherche biblique a échoué.",
      },
      { status: 503 }
    );
  }
}
