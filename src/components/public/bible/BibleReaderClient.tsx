"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Languages, Loader2, Search } from "lucide-react";

type BibleVersion = {
  code: string;
  name: string;
  abbreviation: string;
  access_mode: "internal" | "external";
  language_name: string;
  copyright_note?: string | null;
};

type BibleBook = {
  code: string;
  name_fr: string;
  testament: string;
};

type BibleVerse = {
  version_code: string;
  book_code: string;
  chapter: number;
  verse: number;
  text: string;
};

type PassageResponse = {
  mode: "internal" | "external";
  version: BibleVersion;
  book: BibleBook;
  chapter: number;
  verses: BibleVerse[];
  externalUrl?: string;
};

export default function BibleReaderClient({
  versions,
  books,
}: {
  versions: BibleVersion[];
  books: BibleBook[];
}) {
  const [versionCode, setVersionCode] = useState(
    versions[0]?.code || "lsg1910"
  );
  const [bookCode, setBookCode] = useState("john");
  const [chapter, setChapter] = useState(3);
  const [passage, setPassage] = useState<PassageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.code === versionCode),
    [versions, versionCode]
  );

  const selectedBook = useMemo(
    () => books.find((book) => book.code === bookCode),
    [books, bookCode]
  );

  useEffect(() => {
    let mounted = true;

    async function loadPassage() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/bible/passage?version=${encodeURIComponent(
            versionCode
          )}&book=${encodeURIComponent(bookCode)}&chapter=${encodeURIComponent(
            String(chapter)
          )}`,
          { cache: "no-store" }
        );

        const payload = await response.json();

        if (mounted) {
          setPassage(payload);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPassage();

    return () => {
      mounted = false;
    };
  }, [versionCode, bookCode, chapter]);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <BookOpen className="h-7 w-7" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
              Bible
            </p>
            <h1 className="mt-3 text-3xl font-black">Lire la Bible</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
              Lecture biblique avec LSG interne et accès légal aux versions Segond 21 et Semeur.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Version</span>
            <select
              value={versionCode}
              onChange={(event) => setVersionCode(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            >
              {versions.map((version) => (
                <option key={version.code} value={version.code}>
                  {version.abbreviation} — {version.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Livre</span>
            <select
              value={bookCode}
              onChange={(event) => setBookCode(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            >
              {books.map((book) => (
                <option key={book.code} value={book.code}>
                  {book.name_fr}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Chapitre</span>
            <input
              type="number"
              min={1}
              value={chapter}
              onChange={(event) => setChapter(Number(event.target.value || 1))}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <div className="flex items-end">
            <div className="flex min-h-12 w-full items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]">
              <Languages className="h-4 w-4" />
              {selectedVersion?.language_name || "Français"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-2xl font-black text-[#03357A]">
              {selectedBook?.name_fr || passage?.book?.name_fr || "Livre"} {chapter}
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {selectedVersion?.name || passage?.version?.name || "Version"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-500">
            <Search className="mr-2 inline h-4 w-4" />
            Recherche avancée bientôt
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-3 rounded-3xl bg-[#F8FBFD] p-8 text-sm font-black text-[#03357A]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement du passage...
          </div>
        ) : passage?.mode === "external" ? (
          <div className="mt-6 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-6">
            <h3 className="text-xl font-black text-[#03357A]">
              Version protégée par droits
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Cette version est active dans le module, mais la lecture complète doit se faire via une source autorisée.
            </p>

            {passage.externalUrl && (
              <a
                href={passage.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
              >
                Lire {selectedVersion?.abbreviation} en ligne
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            {selectedVersion?.copyright_note && (
              <p className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-orange-700">
                {selectedVersion.copyright_note}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {passage?.verses?.length ? (
              passage.verses.map((verse) => (
                <p
                  key={`${verse.version_code}-${verse.book_code}-${verse.chapter}-${verse.verse}`}
                  className="rounded-2xl bg-[#F8FBFD] p-4 text-base leading-8 text-slate-700"
                >
                  <sup className="mr-2 rounded-full bg-[#03357A] px-2 py-1 text-xs font-black text-white">
                    {verse.verse}
                  </sup>
                  {verse.text}
                </p>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-6 text-center">
                <h3 className="text-lg font-black text-[#03357A]">
                  Passage non encore importé
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  La structure est prête. Importez les chapitres LSG complets pour enrichir la lecture interne.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
