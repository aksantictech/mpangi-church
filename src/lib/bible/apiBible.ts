const API_BIBLE_BASE_URL = "https://rest.api.bible/v1";

export type BibleLanguage = {
  id: string;
  name: string;
  nameLocal: string;
  script?: string;
  scriptDirection?: string;
};

export type BibleVersion = {
  id: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  description?: string;
  descriptionLocal?: string;
  copyright?: string;
  info?: string;
  language: BibleLanguage;
};

export type BibleChapterSummary = {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
};

export type BibleBook = {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters: BibleChapterSummary[];
};

export type BibleNavigationLink = {
  id: string;
  number: string;
} | null;

export type BibleChapterContent = {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
  content: string;
  verseCount: number;
  copyright?: string;
  next?: BibleNavigationLink;
  previous?: BibleNavigationLink;
};

export type BibleSearchVerse = {
  id: string;
  orgId?: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
};

type ApiBibleResponse<T> = {
  data: T;
  meta?: {
    fumsToken?: string;
  };
};

type ApiBibleFetchOptions = {
  revalidate?: number;
};

function getApiKey() {
  const apiKey = process.env.BIBLE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "BIBLE_API_KEY est manquante. Ajoutez-la dans .env.local et dans Vercel."
    );
  }

  return apiKey;
}

function buildUrl(pathname: string) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }

  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${API_BIBLE_BASE_URL}${cleanPath}`;
}

export async function apiBibleFetch<T>(
  pathname: string,
  options: ApiBibleFetchOptions = {}
): Promise<ApiBibleResponse<T>> {
  const response = await fetch(buildUrl(pathname), {
    headers: {
      "api-key": getApiKey(),
      Accept: "application/json",
    },
    next: {
      revalidate: options.revalidate ?? 600,
    },
  });

  if (!response.ok) {
    let apiMessage = "";

    try {
      const payload = await response.json();
      apiMessage =
        payload?.message ||
        payload?.error ||
        payload?.errors?.[0]?.message ||
        "";
    } catch {
      apiMessage = "";
    }

    const suffix = apiMessage ? ` : ${apiMessage}` : "";

    if (response.status === 401) {
      throw new Error(
        `Clé API.Bible absente, invalide ou non autorisée${suffix}`
      );
    }

    if (response.status === 403) {
      throw new Error(
        `Cette version biblique n’est pas autorisée pour votre licence API.Bible${suffix}`
      );
    }

    if (response.status === 404) {
      throw new Error(`Contenu biblique introuvable${suffix}`);
    }

    throw new Error(
      `API.Bible a répondu avec le statut ${response.status}${suffix}`
    );
  }

  return (await response.json()) as ApiBibleResponse<T>;
}

export function isFrenchBible(version: BibleVersion) {
  const languageId = version.language?.id?.toLowerCase();
  const searchable = [
    version.language?.name,
    version.language?.nameLocal,
    version.name,
    version.nameLocal,
    version.abbreviation,
    version.abbreviationLocal,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    languageId === "fra" ||
    languageId === "fre" ||
    searchable.includes("french") ||
    searchable.includes("français") ||
    searchable.includes("francais")
  );
}

const PREFERRED_VERSION_PATTERNS = [
  /semeur/i,
  /segond\s*21/i,
  /louis\s*segond/i,
  /nouvelle\s*bible\s*segond/i,
  /français\s*courant/i,
  /francais\s*courant/i,
];

export function getBibleVersionPriority(version: BibleVersion) {
  const searchable = [
    version.name,
    version.nameLocal,
    version.abbreviation,
    version.abbreviationLocal,
  ]
    .filter(Boolean)
    .join(" ");

  const preferredIndex = PREFERRED_VERSION_PATTERNS.findIndex((pattern) =>
    pattern.test(searchable)
  );

  return preferredIndex === -1 ? 100 : preferredIndex;
}

export function sanitizeScriptureHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\s(href|src)\s*=\s*["']javascript:[^"']*["']/gi, "");
}

export function stripBibleHtml(html: string) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSafeBibleIdentifier(value: string) {
  return /^[A-Za-z0-9._-]+$/.test(value);
}
