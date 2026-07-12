import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4">
      <section className="max-w-lg rounded-[2rem] border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black text-[#03357A]">Vous êtes hors ligne</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Certaines pages restent accessibles, mais les données en temps réel nécessitent une connexion Internet.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
        >
          Réessayer
        </Link>
      </section>
    </main>
  );
}
