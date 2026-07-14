"use client";

import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Minus,
  Moon,
  Plus,
  Search,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import BibleFumsTracker from "@/components/bible/BibleFumsTracker";

type BibleVersion = {
  id: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  copyright?: string;
  info?: string;
};

type BibleChapterSummary = {
  id: string;
  number: string;
  reference: string;
  bookId: string;
};

type BibleBook = {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
  chapters: BibleChapterSummary[];
};

type ChapterNavigation = {
  id: string;
  number: string;
} | null;

type BibleChapter = {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
  content: string;
  verseCount: number;
  copyright?: string;
  previous?: ChapterNavigation;
  next?: ChapterNavigation;
};

type SearchResult = {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
};

type SavedReading = {
  bibleId: string;
  chapterId: string;
  reference: string;
  savedAt: string;
};

type ReaderTheme = "light" | "sepia" | "dark";

const SETTINGS_KEY = "mpangi-bible-settings-v1";
const BOOKMARKS_KEY = "mpangi-bible-bookmarks-v1";

async function readJson(response: Response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Une erreur est survenue.");
  }

  return payload;
}

function chapterBookId(chapterId: string) {
  return chapterId.split(".")[0] || "";
}

export default function BibleReaderClient({
  churchSlug,
  churchName,
}: {
  churchSlug?: string;
  churchName?: string;
}) {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [fumsToken, setFumsToken] = useState<string | null>(null);

  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [fontScale, setFontScale] = useState(1);
  const [theme, setTheme] = useState<ReaderTheme>("light");
  const [bookmarks, setBookmarks] = useState<SavedReading[]>([]);
  const [copied, setCopied] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedBibleId) || null,
    [versions, selectedBibleId]
  );

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  const selectedChapters = selectedBook?.chapters || [];

  const isBookmarked = Boolean(
    chapter &&
      bookmarks.some(
        (bookmark) =>
          bookmark.bibleId === selectedBibleId &&
          bookmark.chapterId === chapter.id
      )
  );

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}"
      );

      const savedBookmarks = JSON.parse(
        localStorage.getItem(BOOKMARKS_KEY) || "[]"
      );

      if (savedSettings?.fontScale) {
        setFontScale(Number(savedSettings.fontScale));
      }

      if (
        savedSettings?.theme === "light" ||
        savedSettings?.theme === "sepia" ||
        savedSettings?.theme === "dark"
      ) {
        setTheme(savedSettings.theme);
      }

      if (Array.isArray(savedBookmarks)) {
        setBookmarks(savedBookmarks);
      }
    } catch {
      // Les préférences corrompues sont simplement ignorées.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVersions() {
      setLoadingVersions(true);
      setError("");

      try {
        const response = await fetch("/api/bible/versions", {
          cache: "no-store",
        });

        const payload = await readJson(response);
        const availableVersions = payload.data || [];

        if (cancelled) return;

        setVersions(availableVersions);

        const savedSettings = JSON.parse(
          localStorage.getItem(SETTINGS_KEY) || "{}"
        );

        const savedBibleId = availableVersions.some(
          (version: BibleVersion) =>
            version.id === savedSettings?.bibleId
        )
          ? savedSettings.bibleId
          : "";

        setSelectedBibleId(
          savedBibleId || payload.defaultBibleId || availableVersions[0]?.id || ""
        );

        if (availableVersions.length === 0) {
          setError(
            "Aucune version française n’est disponible avec la clé API.Bible actuelle."
          );
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(
            loadError?.message ||
              "Impossible de charger les versions bibliques."
          );
        }
      } finally {
        if (!cancelled) setLoadingVersions(false);
      }
    }

    loadVersions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedBibleId) return;

    let cancelled = false;

    async function loadBooks() {
      setLoadingBooks(true);
      setError("");
      setBooks([]);
      setSelectedBookId("");
      setSelectedChapterId("");
      setChapter(null);

      try {
        const response = await fetch(
          `/api/bible/books?bibleId=${encodeURIComponent(
            selectedBibleId
          )}`,
          { cache: "no-store" }
        );

        const payload = await readJson(response);
        const availableBooks: BibleBook[] = payload.data || [];

        if (cancelled) return;

        setBooks(availableBooks);

        const savedSettings = JSON.parse(
          localStorage.getItem(SETTINGS_KEY) || "{}"
        );

        const savedBook = availableBooks.find(
          (book) => book.id === savedSettings?.bookId
        );

        const initialBook =
          savedBook ||
          availableBooks.find((book) => book.id === "GEN") ||
          availableBooks[0];

        if (!initialBook) {
          setError("Aucun livre n’est disponible pour cette version.");
          return;
        }

        const savedChapter = initialBook.chapters.find(
          (chapterItem) =>
            chapterItem.id === savedSettings?.chapterId
        );

        const initialChapter =
          savedChapter ||
          initialBook.chapters.find(
            (chapterItem) => chapterItem.number === "1"
          ) ||
          initialBook.chapters[0];

        setSelectedBookId(initialBook.id);
        setSelectedChapterId(initialChapter?.id || "");
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Impossible de charger les livres.");
        }
      } finally {
        if (!cancelled) setLoadingBooks(false);
      }
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [selectedBibleId]);

  useEffect(() => {
    if (!selectedBibleId || !selectedChapterId) return;

    let cancelled = false;

    async function loadChapter() {
      setLoadingChapter(true);
      setError("");

      try {
        const response = await fetch(
          `/api/bible/chapter?bibleId=${encodeURIComponent(
            selectedBibleId
          )}&chapterId=${encodeURIComponent(selectedChapterId)}`,
          { cache: "no-store" }
        );

        const payload = await readJson(response);

        if (cancelled) return;

        setChapter(payload.data);
        setFumsToken(payload.fumsToken || null);

        const bookId = payload.data?.bookId || chapterBookId(selectedChapterId);

        if (bookId && bookId !== selectedBookId) {
          setSelectedBookId(bookId);
        }

        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({
            bibleId: selectedBibleId,
            bookId,
            chapterId: selectedChapterId,
            fontScale,
            theme,
          })
        );
      } catch (loadError: any) {
        if (!cancelled) {
          setError(
            loadError?.message || "Impossible de charger le chapitre."
          );
        }
      } finally {
        if (!cancelled) setLoadingChapter(false);
      }
    }

    loadChapter();

    return () => {
      cancelled = true;
    };
  }, [
    selectedBibleId,
    selectedChapterId,
    selectedBookId,
    fontScale,
    theme,
  ]);

  useEffect(() => {
    if (!selectedBibleId) return;

    const current = {
      bibleId: selectedBibleId,
      bookId: selectedBookId,
      chapterId: selectedChapterId,
      fontScale,
      theme,
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  }, [
    selectedBibleId,
    selectedBookId,
    selectedChapterId,
    fontScale,
    theme,
  ]);

  function selectBook(bookId: string) {
    setSelectedBookId(bookId);

    const book = books.find((item) => item.id === bookId);
    const firstChapter =
      book?.chapters.find((item) => item.number === "1") ||
      book?.chapters[0];

    setSelectedChapterId(firstChapter?.id || "");
  }

  function goToChapter(chapterId: string) {
    if (!chapterId) return;

    const bookId = chapterBookId(chapterId);

    if (bookId) setSelectedBookId(bookId);

    setSelectedChapterId(chapterId);
    setShowSearch(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function searchBible(event: FormEvent) {
    event.preventDefault();

    if (!selectedBibleId || searchQuery.trim().length < 2) return;

    setSearching(true);
    setError("");

    try {
      const response = await fetch(
        `/api/bible/search?bibleId=${encodeURIComponent(
          selectedBibleId
        )}&query=${encodeURIComponent(searchQuery.trim())}`,
        { cache: "no-store" }
      );

      const payload = await readJson(response);

      setSearchResults(payload.data || []);
      setFumsToken(payload.fumsToken || null);
    } catch (searchError: any) {
      setError(searchError?.message || "La recherche a échoué.");
    } finally {
      setSearching(false);
    }
  }

  function toggleBookmark() {
    if (!chapter) return;

    let nextBookmarks: SavedReading[];

    if (isBookmarked) {
      nextBookmarks = bookmarks.filter(
        (bookmark) =>
          !(
            bookmark.bibleId === selectedBibleId &&
            bookmark.chapterId === chapter.id
          )
      );
    } else {
      nextBookmarks = [
        {
          bibleId: selectedBibleId,
          chapterId: chapter.id,
          reference: chapter.reference,
          savedAt: new Date().toISOString(),
        },
        ...bookmarks,
      ].slice(0, 50);
    }

    setBookmarks(nextBookmarks);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(nextBookmarks));
  }

  async function shareChapter() {
    if (!chapter) return;

    const url = new URL(window.location.href);
    url.searchParams.set("bible", selectedBibleId);
    url.searchParams.set("chapter", chapter.id);

    const shareData = {
      title: chapter.reference,
      text: `${chapter.reference} — ${selectedVersion?.nameLocal || selectedVersion?.name || "Bible"}`,
      url: url.toString(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Annulation du partage : aucune erreur visible nécessaire.
    }
  }

  const themeClass =
    theme === "dark"
      ? "bg-[#111827] text-slate-100"
      : theme === "sepia"
        ? "bg-[#FFF8E7] text-[#4B3621]"
        : "bg-white text-slate-800";

  if (loadingVersions) {
    return (
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-8 text-center shadow-sm">
        <BookOpen className="mx-auto h-10 w-10 animate-pulse text-[#03357A]" />
        <p className="mt-4 font-black text-[#03357A]">
          Préparation de la Bible…
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <BibleFumsTracker token={fumsToken} />

      <header className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/20 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-blue-100">
              Lecture biblique
            </p>

            <h1 className="mt-2 break-words text-3xl font-black sm:text-4xl">
              {churchName
                ? `Bible — ${churchName}`
                : "Lire et étudier la Bible"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              Choisissez une version française autorisée, un livre et un
              chapitre. Recherchez un mot ou une référence et reprenez votre
              lecture sur cet appareil.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSearch((current) => !current)}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#03357A]"
            >
              {showSearch ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Rechercher
            </button>

            <button
              type="button"
              onClick={toggleBookmark}
              disabled={!chapter}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white ring-1 ring-white/25 disabled:opacity-50"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              Favori
            </button>

            <button
              type="button"
              onClick={shareChapter}
              disabled={!chapter}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white ring-1 ring-white/25 disabled:opacity-50"
            >
              {copied ? (
                <Copy className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copied ? "Copié" : "Partager"}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {showSearch && (
        <section className="mt-4 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={searchBible}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ex. amour, Jean 3:16, foi…"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] pl-12 pr-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </div>

            <button
              type="submit"
              disabled={searching || searchQuery.trim().length < 2}
              className="min-h-12 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-50"
            >
              {searching ? "Recherche…" : "Rechercher"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 grid gap-3">
              {searchResults.map((result) => (
                <button
                  key={`${result.id}-${result.reference}`}
                  type="button"
                  onClick={() => goToChapter(result.chapterId)}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-left transition hover:border-[#03357A]/30 hover:bg-white"
                >
                  <p className="font-black text-[#03357A]">
                    {result.reference}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {result.text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-4 grid gap-3 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Version française
          </span>
          <select
            value={selectedBibleId}
            onChange={(event) => setSelectedBibleId(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold text-[#03357A] outline-none"
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.abbreviationLocal || version.abbreviation} —{" "}
                {version.nameLocal || version.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Livre
          </span>
          <select
            value={selectedBookId}
            onChange={(event) => selectBook(event.target.value)}
            disabled={loadingBooks}
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold text-[#03357A] outline-none disabled:opacity-60"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.nameLong || book.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Chapitre
          </span>
          <select
            value={selectedChapterId}
            onChange={(event) =>
              setSelectedChapterId(event.target.value)
            }
            disabled={loadingBooks || selectedChapters.length === 0}
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-bold text-[#03357A] outline-none disabled:opacity-60"
          >
            {selectedChapters.map((chapterItem) => (
              <option key={chapterItem.id} value={chapterItem.id}>
                {chapterItem.number}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setFontScale((value) => Math.max(0.85, value - 0.1))
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FA] text-[#03357A]"
            aria-label="Réduire la taille du texte"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="min-w-16 text-center text-sm font-black text-[#03357A]">
            {Math.round(fontScale * 100)} %
          </span>

          <button
            type="button"
            onClick={() =>
              setFontScale((value) => Math.min(1.45, value + 0.1))
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FA] text-[#03357A]"
            aria-label="Augmenter la taille du texte"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "light" as const, label: "Clair", icon: Sun },
            { value: "sepia" as const, label: "Sépia", icon: BookOpen },
            { value: "dark" as const, label: "Nuit", icon: Moon },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTheme(item.value)}
                className={[
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black",
                  theme === item.value
                    ? "bg-[#03357A] text-white"
                    : "bg-[#F8FBFD] text-slate-600",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <article
        className={[
          "mt-4 overflow-hidden rounded-[1.75rem] border border-[#DCEAF5] shadow-sm",
          themeClass,
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 border-b border-current/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
              {selectedVersion?.abbreviationLocal ||
                selectedVersion?.abbreviation ||
                "Bible"}
            </p>

            <h2 className="mt-1 break-words text-2xl font-black">
              {chapter?.reference || "Sélectionnez un chapitre"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                chapter?.previous?.id &&
                goToChapter(chapter.previous.id)
              }
              disabled={!chapter?.previous?.id}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-current/10 px-3 text-xs font-black disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>

            <button
              type="button"
              onClick={() =>
                chapter?.next?.id && goToChapter(chapter.next.id)
              }
              disabled={!chapter?.next?.id}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-current/10 px-3 text-xs font-black disabled:opacity-35"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-8 sm:py-8">
          {loadingChapter ? (
            <div className="py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 animate-pulse opacity-60" />
              <p className="mt-4 font-bold opacity-70">
                Chargement du chapitre…
              </p>
            </div>
          ) : chapter ? (
            <div
              className="api-bible-content"
              style={{ fontSize: `${fontScale}rem` }}
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          ) : (
            <div className="py-16 text-center opacity-70">
              Sélectionnez une version, un livre et un chapitre.
            </div>
          )}
        </div>

        {(chapter?.copyright || selectedVersion?.copyright) && (
          <footer className="border-t border-current/10 px-4 py-4 text-xs leading-6 opacity-70 sm:px-8">
            {chapter?.copyright || selectedVersion?.copyright}
          </footer>
        )}
      </article>

      {bookmarks.length > 0 && (
        <section className="mt-4 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-black text-[#03357A]">
            Lectures favorites sur cet appareil
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {bookmarks.slice(0, 12).map((bookmark) => (
              <button
                key={`${bookmark.bibleId}-${bookmark.chapterId}`}
                type="button"
                onClick={() => {
                  setSelectedBibleId(bookmark.bibleId);
                  setSelectedChapterId(bookmark.chapterId);
                  setSelectedBookId(chapterBookId(bookmark.chapterId));
                }}
                className="rounded-xl bg-[#EAF3FA] px-3 py-2 text-xs font-black text-[#03357A]"
              >
                {bookmark.reference}
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
