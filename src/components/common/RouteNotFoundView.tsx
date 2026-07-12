import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function RouteNotFoundView({
  title = "Page introuvable",
  description = "La page demandée n’existe pas ou n’est plus disponible.",
  backHref = "/dashboard",
  backLabel = "Retour",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-[2rem] border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF3FA] text-[#03357A]">
          <SearchX className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-2xl font-black text-[#03357A]">{title}</h1>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
          {description}
        </p>

        <Link
          href={backHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
