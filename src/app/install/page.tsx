import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PwaInstallCard from "@/components/pwa/PwaInstallCard";

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC] px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>

        <PwaInstallCard />

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#03357A]">
            Conditions nécessaires
          </h2>

          <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-600 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <p className="font-black text-[#03357A]">Android</p>
              <p>Utilisez Chrome, Edge ou Samsung Internet. Le site doit être en HTTPS.</p>
            </div>

            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <p className="font-black text-[#03357A]">iPhone</p>
              <p>Apple ne montre pas le bouton automatique. L’installation se fait via Safari → Partager → Écran d’accueil.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
