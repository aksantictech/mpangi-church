import Link from "next/link";
import { BookOpen, Languages } from "lucide-react";

export default function PublicBibleBlock({
  slug,
}: {
  slug: string;
}) {
  return (
    <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <BookOpen className="h-7 w-7" />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#8B5CF6]">
              Bible
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#03357A]">
              Lire la Bible
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Accédez à la lecture biblique avec LSG, Segond 21 et Bible du Semeur.
            </p>
          </div>
        </div>

        <Link
          href={`/church/${slug}/bible`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
        >
          <Languages className="h-4 w-4" />
          Lire la Bible
        </Link>
      </div>
    </section>
  );
}
