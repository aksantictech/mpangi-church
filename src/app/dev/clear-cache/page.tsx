"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, RefreshCw, Trash2 } from "lucide-react";

export default function DevClearCachePage() {
  const [message, setMessage] = useState("");

  async function clearEverything() {
    setMessage("Nettoyage en cours...");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      localStorage.removeItem("mpangi-dev-cache-cleaned");
      sessionStorage.setItem("mpangi-dev-cache-cleaned", "true");

      setMessage("Cache local, service workers et caches PWA supprimés.");
    } catch (error: any) {
      setMessage(error?.message || "Nettoyage terminé avec avertissement.");
    }
  }

  function hardReload() {
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
      <section className="w-full max-w-2xl rounded-[2rem] border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF3FA] text-[#03357A]">
          <Trash2 className="h-8 w-8" />
        </div>

        <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">
          Développement local
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#03357A]">
          Nettoyer le cache local
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
          Cette page supprime les service workers, caches PWA et caches navigateur
          liés à localhost. Elle aide à corriger les erreurs ChunkLoadError en
          développement.
        </p>

        {message && (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {message}
          </div>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={clearEverything}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
          >
            <Trash2 className="h-4 w-4" />
            Nettoyer maintenant
          </button>

          <button
            type="button"
            onClick={hardReload}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A]"
          >
            <RefreshCw className="h-4 w-4" />
            Retour accueil
          </button>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700"
          >
            Accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
