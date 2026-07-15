import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

export default function PublicBibleBlock({
  slug,
}: {
  slug: string;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#DCEAF5] bg-white shadow-sm">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <BookOpen className="h-6 w-6" />
          </div>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-[#2563EB]">
            Bible intégrée
          </p>

          <h2 className="mt-2 break-words text-2xl font-black text-[#03357A]">
            Lisez la Bible directement dans l’application
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Livres, chapitres, versets, recherche, favoris, mode nuit et
            reprise de lecture. Les versions disponibles dépendent de la
            licence biblique activée pour Mpangi-church.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Louis Segond",
              "Segond 21",
              "Bible du Semeur",
            ].map((version) => (
              <span
                key={version}
                className="inline-flex items-center gap-1 rounded-full bg-[#F8FBFD] px-3 py-2 text-xs font-black text-[#03357A] ring-1 ring-[#DCEAF5]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                {version}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/church/${slug}/bible`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/15"
        >
          Lire la Bible
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
