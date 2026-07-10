"use client";

import { useMemo, useState } from "react";
import { BookOpen, Languages, Search } from "lucide-react";

type BibleVersion = { code: string; name: string; language_code: string; language_name: string; copyright_note?: string | null };
type BibleBook = { code: string; name_fr: string; testament: string };
type BibleVerse = { version_code: string; book_code: string; chapter: number; verse: number; text: string };

export default function BibleReaderClient({ versions, books, initialVerses }: { versions: BibleVersion[]; books: BibleBook[]; initialVerses: BibleVerse[] }) {
  const [versionCode, setVersionCode] = useState(versions[0]?.code || "fr-lsg");
  const [bookCode, setBookCode] = useState("john");
  const [chapter, setChapter] = useState(3);
  const selectedVersion = versions.find((version) => version.code === versionCode);
  const selectedBook = books.find((book) => book.code === bookCode);
  const verses = useMemo(() => initialVerses.filter((verse) => verse.version_code === versionCode && verse.book_code === bookCode && verse.chapter === chapter), [initialVerses, versionCode, bookCode, chapter]);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><BookOpen className="h-7 w-7" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Bible</p><h1 className="mt-3 text-3xl font-black">Lire la Bible</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Lecture biblique avec versions et langues. Les traductions locales peuvent être importées et validées par l’église.</p></div></div>
      </section>
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-2"><span className="text-sm font-black text-[#03357A]">Version</span><select value={versionCode} onChange={(event) => setVersionCode(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]">{versions.map((version) => <option key={version.code} value={version.code}>{version.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-black text-[#03357A]">Livre</span><select value={bookCode} onChange={(event) => setBookCode(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]">{books.map((book) => <option key={book.code} value={book.code}>{book.name_fr}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-black text-[#03357A]">Chapitre</span><input type="number" min={1} value={chapter} onChange={(event) => setChapter(Number(event.target.value || 1))} className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]" /></label>
        <div className="flex items-end"><div className="flex min-h-12 w-full items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]"><Languages className="h-4 w-4" />{selectedVersion?.language_name || "Langue"}</div></div>
      </div></section>
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-[#03357A]">{selectedBook?.name_fr || "Livre"} {chapter}</h2><p className="mt-1 text-sm font-bold text-slate-500">{selectedVersion?.name || "Version"}</p></div><div className="hidden rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-500 md:flex md:items-center md:gap-2"><Search className="h-4 w-4" />Recherche bientôt</div></div><div className="mt-6 space-y-4">{verses.length === 0 ? <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-6 text-center"><h3 className="text-lg font-black text-[#03357A]">Texte non encore importé</h3><p className="mt-2 text-sm leading-7 text-slate-500">La structure est prête. Il faut importer les textes bibliques autorisés pour cette version/langue.</p></div> : verses.map((verse) => <p key={`${verse.version_code}-${verse.book_code}-${verse.chapter}-${verse.verse}`} className="rounded-2xl bg-[#F8FBFD] p-4 text-base leading-8 text-slate-700"><sup className="mr-2 rounded-full bg-[#03357A] px-2 py-1 text-xs font-black text-white">{verse.verse}</sup>{verse.text}</p>)}</div>{selectedVersion?.copyright_note && <p className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-orange-700">{selectedVersion.copyright_note}</p>}</section>
    </div>
  );
}
