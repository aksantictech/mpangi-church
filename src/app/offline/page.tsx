import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4">
      <section className="max-w-md rounded-[2rem] border border-[#DCEAF5] bg-white p-8 text-center shadow-xl shadow-blue-950/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF3FA] text-[#03357A]">
          <WifiOff className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-2xl font-black text-[#03357A]">
          Connexion indisponible
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-500">
          Vous êtes hors ligne. Vérifiez votre connexion Internet puis réessayez.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}