"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function RouteErrorView({
  title = "Une erreur est survenue",
  description = "La page n’a pas pu se charger correctement.",
  error,
  reset,
  backHref = "/dashboard",
  backLabel = "Retour",
}: {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-[2rem] border border-red-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-700">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-2xl font-black text-[#03357A]">{title}</h1>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
          {description}
        </p>

        {error?.message && (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-left text-xs font-semibold leading-6 text-red-700">
            {error.message}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {reset && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          )}

          <Link
            href={backHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A]"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
