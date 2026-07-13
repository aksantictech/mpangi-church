"use client";

import { RefreshCw } from "lucide-react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
          <section className="w-full max-w-2xl rounded-[2rem] border border-red-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-700">
              !
            </div>

            <h1 className="mt-5 text-3xl font-black text-[#03357A]">
              Erreur application
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Une erreur a empêché le chargement complet de la page.
            </p>

            {error?.message && (
              <pre className="mt-5 overflow-x-auto rounded-2xl bg-red-50 p-4 text-left text-xs font-bold text-red-700">
                {error.message}
              </pre>
            )}

            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
