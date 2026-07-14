import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import UniversalInstallButton from "@/components/pwa/UniversalInstallButton";

export default function InstallPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
      <section className="w-full max-w-3xl rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-black text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF3FA] text-[#03357A]">
          <Smartphone className="h-8 w-8" />
        </div>

        <h1 className="mt-5 text-3xl font-black text-[#03357A] sm:text-4xl">
          Installer l’application
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          Installez Mpangi-church sur votre téléphone, tablette ou ordinateur.
          Sur un sous-domaine d’église, l’application utilise automatiquement
          le nom et le logo de cette église.
        </p>

        <div className="mt-6">
          <UniversalInstallButton />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            "Accès depuis l’écran d’accueil",
            "Affichage autonome",
            "Identité propre à l’église",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600"
            >
              <CheckCircle2 className="mb-2 h-5 w-5 text-green-600" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
