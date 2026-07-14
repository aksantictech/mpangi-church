import { NextResponse } from "next/server";
import {
  apiBibleFetch,
  type BibleVersion,
  getBibleVersionPriority,
  isFrenchBible,
} from "@/lib/bible/apiBible";

export const dynamic = "force-dynamic";

function getAllowedVersionIds() {
  return new Set(
    String(process.env.BIBLE_ALLOWED_VERSION_IDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export async function GET() {
  try {
    const response = await apiBibleFetch<BibleVersion[]>(
      "/bibles?language=fra&include-full-details=true",
      { revalidate: 21600 }
    );

    const allowedIds = getAllowedVersionIds();
    const versions = (response.data || [])
      .filter(isFrenchBible)
      .filter(
        (version) => allowedIds.size === 0 || allowedIds.has(version.id)
      )
      .sort((a, b) => {
        const priority =
          getBibleVersionPriority(a) - getBibleVersionPriority(b);

        if (priority !== 0) return priority;

        return (a.nameLocal || a.name).localeCompare(
          b.nameLocal || b.name,
          "fr"
        );
      });

    const requestedDefault =
      process.env.BIBLE_DEFAULT_VERSION_ID?.trim() || "";

    const defaultBibleId =
      versions.find((version) => version.id === requestedDefault)?.id ||
      versions[0]?.id ||
      null;

    return NextResponse.json({
      data: versions,
      defaultBibleId,
      note:
        "Seules les versions françaises autorisées par votre clé API.Bible sont affichées.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Impossible de charger les versions bibliques françaises.",
      },
      { status: 503 }
    );
  }
}
