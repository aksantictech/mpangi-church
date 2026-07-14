import { NextRequest, NextResponse } from "next/server";
import {
  apiBibleFetch,
  BibleChapterContent,
  isSafeBibleIdentifier,
  sanitizeScriptureHtml,
} from "@/lib/bible/apiBible";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const bibleId = request.nextUrl.searchParams.get("bibleId")?.trim() || "";
  const chapterId =
    request.nextUrl.searchParams.get("chapterId")?.trim() || "";

  if (
    !bibleId ||
    !chapterId ||
    !isSafeBibleIdentifier(bibleId) ||
    !isSafeBibleIdentifier(chapterId)
  ) {
    return NextResponse.json(
      { error: "Version ou chapitre invalide." },
      { status: 400 }
    );
  }

  const query = new URLSearchParams({
    "content-type": "html",
    "include-notes": "false",
    "include-titles": "true",
    "include-chapter-numbers": "false",
    "include-verse-numbers": "true",
    "include-verse-spans": "true",
    "use-org-id": "false",
    "fums-version": "3",
  });

  try {
    const response = await apiBibleFetch<BibleChapterContent>(
      `/bibles/${encodeURIComponent(
        bibleId
      )}/chapters/${encodeURIComponent(chapterId)}?${query.toString()}`,
      { revalidate: 600 }
    );

    return NextResponse.json(
      {
        data: {
          ...response.data,
          content: sanitizeScriptureHtml(response.data?.content || ""),
        },
        fumsToken: response.meta?.fumsToken || null,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=120",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Impossible de charger ce chapitre.",
      },
      { status: 503 }
    );
  }
}
