import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildPassage(bookName: string, chapter: number) {
  return `${bookName} ${chapter}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const versionCode = url.searchParams.get("version") || "lsg1910";
  const bookCode = url.searchParams.get("book") || "john";
  const chapter = Number(url.searchParams.get("chapter") || 3);

  const admin = createAdminClient();

  const [{ data: version }, { data: book }] = await Promise.all([
    admin
      .from("bible_versions")
      .select("*")
      .eq("code", versionCode)
      .maybeSingle(),

    admin
      .from("bible_books")
      .select("*")
      .eq("code", bookCode)
      .maybeSingle(),
  ]);

  if (!version || !book) {
    return NextResponse.json(
      { error: "Version ou livre introuvable." },
      { status: 404 }
    );
  }

  if (version.access_mode === "external") {
    const passage = encodeURIComponent(buildPassage(book.name_fr, chapter));
    const externalUrl = String(version.external_url_template || "").replace(
      "{PASSAGE}",
      passage
    );

    return NextResponse.json({
      mode: "external",
      version,
      book,
      chapter,
      externalUrl,
      verses: [],
    });
  }

  const { data: verses } = await admin
    .from("bible_verses")
    .select("*")
    .eq("version_code", versionCode)
    .eq("book_code", bookCode)
    .eq("chapter", chapter)
    .order("verse", { ascending: true });

  return NextResponse.json({
    mode: "internal",
    version,
    book,
    chapter,
    verses: verses ?? [],
  });
}
