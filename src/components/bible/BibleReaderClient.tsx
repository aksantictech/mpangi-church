"use client";

import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Moon,
  Search,
  Share2,
  Sun,
  Type,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type BibleVersion = {
  id: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
  nameLocal?: string;
  copyright?: string;
  language?: {
    id?: string;
    name?: string;
    nameLocal?: string;
  };
};

type BibleChapterSummary = {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
};

type BibleBook = {
  id: string;
  bibleId: string;
  abbreviation?: string;
  name: string;
  nameLong?: string;
  chapters?: BibleChapterSummary[];
};

type BibleChapterContent = {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
  content: string;
  verseCount?: number;
  copyright?: string;
  next?: {
    id: string;
    number: string;
  } | null;
  previous?: {
    id: string;
    number: string;
  } | null;
};

type SearchVerse = {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
};

type ReaderTheme =
  | "light"
  | "sepia"
  | "dark";

const STORAGE_KEY =
  "mpangi-bible-reader-v2";

function getVersionLabel(
  version?: BibleVersion
) {
  if (!version) {
    return "Version";
  }

  const abbreviation =
    version.abbreviationLocal ||
    version.abbreviation ||
    "";

  const name =
    version.nameLocal ||
    version.name ||
    "Bible";

  return abbreviation
    ? `${abbreviation} — ${name}`
    : name;
}

function getShortBookName(
  book?: BibleBook
) {
  if (!book) return "Livre";

  const raw =
    book.name?.trim() ||
    book.nameLong?.trim() ||
    "Livre";

  const aliases: Array<
    [RegExp, string]
  > = [
    [
      /le premier livre de mo[iï]se.*gen[eè]se/i,
      "Genèse",
    ],
    [
      /le deuxi[eè]me livre de mo[iï]se.*exode/i,
      "Exode",
    ],
    [
      /le troisi[eè]me livre de mo[iï]se.*l[eé]vitique/i,
      "Lévitique",
    ],
    [
      /le quatri[eè]me livre de mo[iï]se.*nombres/i,
      "Nombres",
    ],
    [
      /le cinqui[eè]me livre de mo[iï]se.*deut[eé]ronome/i,
      "Deutéronome",
    ],
  ];

  for (const [
    pattern,
    replacement,
  ] of aliases) {
    if (pattern.test(raw)) {
      return replacement;
    }
  }

  return raw
    .replace(
      /^Le livre de\s+/i,
      ""
    )
    .replace(
      /^L['’]Évangile selon\s+/i,
      ""
    )
    .replace(
      /^Évangile selon\s+/i,
      ""
    );
}

function chapterOptions(
  book?: BibleBook
) {
  return (book?.chapters || []).filter(
    (chapter) =>
      chapter.id &&
      /^\d+$/.test(
        String(
          chapter.number
        )
      )
  );
}

function themeClasses(
  theme: ReaderTheme
) {
  if (theme === "dark") {
    return {
      shell:
        "bg-slate-950 text-slate-100",
      card:
        "border-slate-800 bg-slate-900",
      muted:
        "text-slate-300",
      field:
        "border-slate-700 bg-slate-950 text-slate-100",
      soft:
        "bg-slate-800 text-slate-100",
    };
  }

  if (theme === "sepia") {
    return {
      shell:
        "bg-[#F4E8D0] text-[#3B2F24]",
      card:
        "border-[#D8C49D] bg-[#FFF8E8]",
      muted:
        "text-[#6B5843]",
      field:
        "border-[#D8C49D] bg-[#FFFDF5] text-[#3B2F24]",
      soft:
        "bg-[#EAD8B5] text-[#4D3B2A]",
    };
  }

  return {
    shell:
      "bg-[#F5F9FC] text-slate-800",
    card:
      "border-[#DCEAF5] bg-white",
    muted:
      "text-slate-600",
    field:
      "border-[#C9DBEA] bg-white text-slate-900",
    soft:
      "bg-[#EAF3FA] text-[#03357A]",
  };
}

export default function BibleReaderClient({
  churchSlug,
  churchName,
}: {
  churchSlug: string;
  churchName: string;
}) {
  const [
    versions,
    setVersions,
  ] = useState<BibleVersion[]>(
    []
  );

  const [
    books,
    setBooks,
  ] = useState<BibleBook[]>(
    []
  );

  const [
    bibleId,
    setBibleId,
  ] = useState("");

  const [
    bookId,
    setBookId,
  ] = useState("");

  const [
    chapterId,
    setChapterId,
  ] = useState("");

  const [
    chapter,
    setChapter,
  ] =
    useState<BibleChapterContent | null>(
      null
    );

  const [
    loadingVersions,
    setLoadingVersions,
  ] = useState(true);

  const [
    loadingBooks,
    setLoadingBooks,
  ] = useState(false);

  const [
    loadingChapter,
    setLoadingChapter,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    fontScale,
    setFontScale,
  ] = useState(100);

  const [
    theme,
    setTheme,
  ] =
    useState<ReaderTheme>(
      "light"
    );

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<SearchVerse[]>(
    []
  );

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    favorite,
    setFavorite,
  ] = useState(false);

  const selectedVersion =
    useMemo(
      () =>
        versions.find(
          (version) =>
            version.id ===
            bibleId
        ),
      [versions, bibleId]
    );

  const selectedBook =
    useMemo(
      () =>
        books.find(
          (book) =>
            book.id === bookId
        ),
      [books, bookId]
    );

  const chapters =
    useMemo(
      () =>
        chapterOptions(
          selectedBook
        ),
      [selectedBook]
    );

  const classes =
    themeClasses(theme);

  useEffect(() => {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          ) || "{}"
        );

      if (
        typeof saved.fontScale ===
        "number"
      ) {
        setFontScale(
          Math.min(
            145,
            Math.max(
              85,
              saved.fontScale
            )
          )
        );
      }

      if (
        ["light", "sepia", "dark"].includes(
          saved.theme
        )
      ) {
        setTheme(
          saved.theme
        );
      }
    } catch {
      // Les préférences locales restent facultatives.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bibleId,
        bookId,
        chapterId,
        fontScale,
        theme,
      })
    );
  }, [
    bibleId,
    bookId,
    chapterId,
    fontScale,
    theme,
  ]);

  useEffect(() => {
    let active = true;

    async function loadVersions() {
      setLoadingVersions(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/bible/versions",
            {
              cache: "no-store",
            }
          );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Impossible de charger les versions bibliques."
          );
        }

        const nextVersions =
          (payload.data ||
            []) as BibleVersion[];

        if (!active) return;

        setVersions(
          nextVersions
        );

        let savedBibleId = "";

        try {
          savedBibleId =
            JSON.parse(
              localStorage.getItem(
                STORAGE_KEY
              ) || "{}"
            ).bibleId || "";
        } catch {
          savedBibleId = "";
        }

        const firstId =
          nextVersions.find(
            (item) =>
              item.id ===
              savedBibleId
          )?.id ||
          payload.defaultBibleId ||
          nextVersions[0]?.id ||
          "";

        setBibleId(firstId);

        if (
          nextVersions.length === 0
        ) {
          setError(
            "Aucune version française n’est disponible avec la clé API.Bible actuelle."
          );
        }
      } catch (
        loadError: any
      ) {
        if (active) {
          setError(
            loadError?.message ||
              "Impossible de charger les versions bibliques."
          );
        }
      } finally {
        if (active) {
          setLoadingVersions(
            false
          );
        }
      }
    }

    loadVersions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!bibleId) {
      setBooks([]);
      setBookId("");
      setChapterId("");
      setChapter(null);
      return;
    }

    let active = true;

    async function loadBooks() {
      setLoadingBooks(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/bible/books?bibleId=${encodeURIComponent(
              bibleId
            )}`,
            {
              cache: "no-store",
            }
          );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Impossible de charger les livres."
          );
        }

        const nextBooks =
          (payload.data ||
            []) as BibleBook[];

        if (!active) return;

        setBooks(nextBooks);

        let savedBookId = "";

        try {
          savedBookId =
            JSON.parse(
              localStorage.getItem(
                STORAGE_KEY
              ) || "{}"
            ).bookId || "";
        } catch {
          savedBookId = "";
        }

        const nextBook =
          nextBooks.find(
            (item) =>
              item.id ===
              savedBookId
          ) ||
          nextBooks.find(
            (item) =>
              item.id
                .toUpperCase()
                .startsWith(
                  "GEN"
                )
          ) ||
          nextBooks[0];

        setBookId(
          nextBook?.id || ""
        );

        const nextChapters =
          chapterOptions(
            nextBook
          );

        setChapterId(
          nextChapters[0]?.id ||
            ""
        );
      } catch (
        loadError: any
      ) {
        if (active) {
          setError(
            loadError?.message ||
              "Impossible de charger les livres."
          );
        }
      } finally {
        if (active) {
          setLoadingBooks(
            false
          );
        }
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [bibleId]);

  useEffect(() => {
    if (
      !bibleId ||
      !chapterId
    ) {
      setChapter(null);
      return;
    }

    let active = true;

    async function loadChapter() {
      setLoadingChapter(
        true
      );
      setError("");

      try {
        const response =
          await fetch(
            `/api/bible/chapter?bibleId=${encodeURIComponent(
              bibleId
            )}&chapterId=${encodeURIComponent(
              chapterId
            )}`,
            {
              cache: "no-store",
            }
          );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            [
              payload.error,
              payload.details
                ? JSON.stringify(
                    payload.details
                  )
                : "",
            ]
              .filter(Boolean)
              .join(" — ")
          );
        }

        if (active) {
          setChapter(
            payload.data ||
              null
          );
        }
      } catch (
        loadError: any
      ) {
        if (active) {
          setChapter(null);
          setError(
            loadError?.message ||
              "Impossible de charger ce chapitre."
          );
        }
      } finally {
        if (active) {
          setLoadingChapter(
            false
          );
        }
      }
    }

    loadChapter();

    return () => {
      active = false;
    };
  }, [
    bibleId,
    chapterId,
  ]);

  useEffect(() => {
    if (!chapter?.reference) {
      setFavorite(false);
      return;
    }

    try {
      const favorites =
        JSON.parse(
          localStorage.getItem(
            "mpangi-bible-favorites"
          ) || "[]"
        ) as string[];

      setFavorite(
        favorites.includes(
          `${bibleId}:${chapter.id}`
        )
      );
    } catch {
      setFavorite(false);
    }
  }, [
    bibleId,
    chapter?.id,
    chapter?.reference,
  ]);

  function handleBookChange(
    nextBookId: string
  ) {
    setBookId(nextBookId);

    const nextBook =
      books.find(
        (item) =>
          item.id ===
          nextBookId
      );

    const nextChapters =
      chapterOptions(nextBook);

    setChapterId(
      nextChapters[0]?.id ||
        ""
    );
  }

  async function shareChapter() {
    const title =
      chapter?.reference ||
      `${getShortBookName(
        selectedBook
      )} ${chapter?.number || ""}`;

    const text = `${title} — ${getVersionLabel(
      selectedVersion
    )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url:
            window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `${text}\n${window.location.href}`
        );

        alert(
          "Lien copié dans le presse-papiers."
        );
      }
    } catch {
      // Un abandon volontaire du partage n'est pas une erreur.
    }
  }

  function toggleFavorite() {
    if (!chapter?.id) return;

    const key =
      `${bibleId}:${chapter.id}`;

    let favorites: string[] =
      [];

    try {
      favorites =
        JSON.parse(
          localStorage.getItem(
            "mpangi-bible-favorites"
          ) || "[]"
        );
    } catch {
      favorites = [];
    }

    const next =
      favorites.includes(key)
        ? favorites.filter(
            (item) =>
              item !== key
          )
        : [
            ...favorites,
            key,
          ];

    localStorage.setItem(
      "mpangi-bible-favorites",
      JSON.stringify(next)
    );

    setFavorite(
      next.includes(key)
    );
  }

  async function runSearch(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      searchQuery.trim().length <
      2
    ) {
      setError(
        "Saisissez au moins deux caractères pour la recherche."
      );
      return;
    }

    setSearching(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/bible/search?bibleId=${encodeURIComponent(
            bibleId
          )}&query=${encodeURIComponent(
            searchQuery.trim()
          )}`,
          {
            cache: "no-store",
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "La recherche a échoué."
        );
      }

      setSearchResults(
        payload.data || []
      );
    } catch (
      searchError: any
    ) {
      setError(
        searchError?.message ||
          "La recherche a échoué."
      );
    } finally {
      setSearching(false);
    }
  }

  function openSearchResult(
    result: SearchVerse
  ) {
    setBookId(
      result.bookId
    );
    setChapterId(
      result.chapterId
    );
    setSearchOpen(false);
    setSearchResults([]);
    setSearchQuery("");
  }

  return (
    <div
      data-bible-reader
      data-bible-theme={theme}
      className={[
        "mx-auto w-full max-w-7xl space-y-4 rounded-[1.5rem] transition-colors",
        classes.shell,
      ].join(" ")}
      style={
        {
          "--bible-font-scale":
            fontScale,
        } as React.CSSProperties
      }
    >
      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-4 text-white shadow-lg shadow-blue-900/20 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-100">
              Lecture biblique
            </p>

            <h1 className="mt-2 break-words text-2xl font-black sm:text-4xl">
              Bible — {churchName}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50 sm:leading-7">
              Choisissez une
              version française,
              un livre et un
              chapitre. Les
              versions disponibles
              sont chargées selon
              l’accès API de
              l’application.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            <button
              type="button"
              onClick={() =>
                setSearchOpen(
                  true
                )
              }
              disabled={!bibleId}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-[#03357A] disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <Search className="h-4 w-4" />
              Rechercher
            </button>

            <button
              type="button"
              onClick={
                toggleFavorite
              }
              disabled={!chapter}
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black ring-1 ring-white/20 disabled:opacity-50 sm:px-4 sm:text-sm",
                favorite
                  ? "bg-amber-300 text-amber-950"
                  : "bg-white/10 text-white",
              ].join(" ")}
            >
              <Bookmark
                className={[
                  "h-4 w-4",
                  favorite
                    ? "fill-current"
                    : "",
                ].join(" ")}
              />
              Favori
            </button>

            <button
              type="button"
              onClick={
                shareChapter
              }
              disabled={!chapter}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-black text-white ring-1 ring-white/20 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          {error}
        </div>
      )}

      <section
        className={[
          "rounded-[1.5rem] border p-3 shadow-sm sm:p-5",
          classes.card,
        ].join(" ")}
      >
        <div className="grid gap-3 lg:grid-cols-[1.25fr_1.25fr_0.65fr]">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-[#64748B]">
              Version française
            </span>

            <select
              value={bibleId}
              onChange={(event) =>
                setBibleId(
                  event.target.value
                )
              }
              disabled={
                loadingVersions
              }
              className={[
                "min-h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10",
                classes.field,
              ].join(" ")}
            >
              {loadingVersions && (
                <option value="">
                  Chargement...
                </option>
              )}

              {versions.map(
                (version) => (
                  <option
                    key={
                      version.id
                    }
                    value={
                      version.id
                    }
                  >
                    {getVersionLabel(
                      version
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-[#64748B]">
              Livre
            </span>

            <select
              value={bookId}
              onChange={(event) =>
                handleBookChange(
                  event.target.value
                )
              }
              disabled={
                loadingBooks ||
                books.length ===
                  0
              }
              className={[
                "min-h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10",
                classes.field,
              ].join(" ")}
            >
              {loadingBooks && (
                <option value="">
                  Chargement...
                </option>
              )}

              {books.map(
                (book) => (
                  <option
                    key={
                      book.id
                    }
                    value={
                      book.id
                    }
                  >
                    {getShortBookName(
                      book
                    )}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-[#64748B]">
              Chapitre
            </span>

            <select
              value={chapterId}
              onChange={(event) =>
                setChapterId(
                  event.target.value
                )
              }
              disabled={
                chapters.length ===
                0
              }
              className={[
                "min-h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10",
                classes.field,
              ].join(" ")}
            >
              {chapters.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.number}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </section>

      <section
        className={[
          "rounded-[1.5rem] border p-3 shadow-sm sm:p-4",
          classes.card,
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-[#03357A]" />

            <button
              type="button"
              onClick={() =>
                setFontScale(
                  (value) =>
                    Math.max(
                      85,
                      value - 10
                    )
                )
              }
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl",
                classes.soft,
              ].join(" ")}
              aria-label="Réduire la taille du texte"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="min-w-14 text-center text-sm font-black">
              {fontScale} %
            </span>

            <button
              type="button"
              onClick={() =>
                setFontScale(
                  (value) =>
                    Math.min(
                      145,
                      value + 10
                    )
                )
              }
              className={[
                "flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black",
                classes.soft,
              ].join(" ")}
              aria-label="Augmenter la taille du texte"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/5 p-1">
            <ThemeButton
              active={
                theme === "light"
              }
              label="Clair"
              icon={Sun}
              onClick={() =>
                setTheme("light")
              }
            />

            <ThemeButton
              active={
                theme === "sepia"
              }
              label="Sépia"
              icon={BookOpen}
              onClick={() =>
                setTheme("sepia")
              }
            />

            <ThemeButton
              active={
                theme === "dark"
              }
              label="Nuit"
              icon={Moon}
              onClick={() =>
                setTheme("dark")
              }
            />
          </div>
        </div>
      </section>

      <section
        className={[
          "overflow-hidden rounded-[1.5rem] border shadow-sm",
          classes.card,
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 border-b border-current/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">
              {selectedVersion
                ? selectedVersion.abbreviationLocal ||
                  selectedVersion.abbreviation ||
                  "Bible"
                : "Bible"}
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#03357A] dark:text-blue-300">
              {chapter?.reference ||
                `${getShortBookName(
                  selectedBook
                )} ${
                  chapter?.number ||
                  ""
                }`}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  chapter?.previous
                    ?.id
                ) {
                  setChapterId(
                    chapter.previous.id
                  );
                }
              }}
              disabled={
                !chapter?.previous
                  ?.id
              }
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-40",
                classes.soft,
              ].join(" ")}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  chapter?.next?.id
                ) {
                  setChapterId(
                    chapter.next.id
                  );
                }
              }}
              disabled={
                !chapter?.next?.id
              }
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:opacity-40",
                classes.soft,
              ].join(" ")}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loadingChapter ? (
          <div className="flex min-h-72 items-center justify-center gap-3 p-8 text-sm font-black text-[#03357A]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement du
            chapitre...
          </div>
        ) : chapter?.content ? (
          <article
            className={[
              "bible-scripture-content min-h-72 p-5 sm:p-8",
              classes.muted,
            ].join(" ")}
            dangerouslySetInnerHTML={{
              __html:
                chapter.content,
            }}
          />
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <BookOpen className="h-12 w-12 text-[#3F79B3]" />

            <p className="mt-4 font-black text-[#03357A]">
              Sélectionnez une
              version, un livre et
              un chapitre.
            </p>
          </div>
        )}

        {chapter?.copyright && (
          <div className="border-t border-current/10 p-4 text-xs leading-5 text-[#64748B]">
            {chapter.copyright}
          </div>
        )}
      </section>

      {searchOpen && (
        <div className="fixed inset-0 z-[120] flex items-end bg-slate-950/60 p-0 sm:items-center sm:justify-center sm:p-4">
          <section
            className={[
              "max-h-[88dvh] w-full overflow-hidden rounded-t-[2rem] border shadow-2xl sm:max-w-2xl sm:rounded-[2rem]",
              classes.card,
            ].join(" ")}
          >
            <div className="flex items-center justify-between border-b border-current/10 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3F79B3]">
                  Recherche
                </p>

                <h3 className="mt-1 text-xl font-black text-[#03357A]">
                  Rechercher dans
                  la Bible
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSearchOpen(
                    false
                  )
                }
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  classes.soft,
                ].join(" ")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={runSearch}
              className="grid gap-2 border-b border-current/10 p-4 sm:grid-cols-[1fr_auto]"
            >
              <input
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Mot, expression ou référence..."
                className={[
                  "min-h-12 rounded-2xl border px-4 text-base font-bold outline-none focus:border-[#03357A]",
                  classes.field,
                ].join(" ")}
              />

              <button
                type="submit"
                disabled={
                  searching ||
                  !bibleId
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Rechercher
              </button>
            </form>

            <div className="max-h-[58dvh] space-y-2 overflow-y-auto p-4">
              {searchResults.length ===
              0 ? (
                <div className="rounded-2xl bg-black/5 p-6 text-center text-sm font-semibold text-[#64748B]">
                  Les résultats
                  apparaîtront ici.
                </div>
              ) : (
                searchResults.map(
                  (result) => (
                    <button
                      key={
                        result.id
                      }
                      type="button"
                      onClick={() =>
                        openSearchResult(
                          result
                        )
                      }
                      className={[
                        "w-full rounded-2xl p-4 text-left",
                        classes.soft,
                      ].join(" ")}
                    >
                      <p className="text-sm font-black text-[#03357A]">
                        {
                          result.reference
                        }
                      </p>

                      <p className="mt-2 line-clamp-3 text-sm leading-6">
                        {
                          result.text
                        }
                      </p>
                    </button>
                  )
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ThemeButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Sun;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition",
        active
          ? "bg-[#03357A] text-white"
          : "text-slate-600",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">
        {label}
      </span>
    </button>
  );
}
