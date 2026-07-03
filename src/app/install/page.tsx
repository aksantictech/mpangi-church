import Link from "next/link";
import {
  ArrowLeft,
  MonitorSmartphone,
  Share,
  Smartphone,
} from "lucide-react";
import PwaInstallButton from "@/components/pwa/PwaInstallButton";

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC] px-4 py-6 text-[#0F172A]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
            <MonitorSmartphone className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Installer Mpangi-church
          </h1>

          <p className="mt-3 text-sm leading-7 text-blue-50">
            Ajoutez l’application sur votre téléphone ou ordinateur pour un
            accès rapide, comme une application mobile.
          </p>

          <div className="mt-6">
            <PwaInstallButton
              label="Installer maintenant"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA] sm:w-auto"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Smartphone className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-[#03357A]">
              Android
            </h2>

            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Ouvrir l’application avec Chrome.</li>
              <li>2. Utiliser l’URL Vercel en HTTPS.</li>
              <li>3. Appuyer sur le menu ⋮ du navigateur.</li>
              <li>4. Choisir “Installer l’application”.</li>
            </ol>
          </article>

          <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Share className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-[#03357A]">
              iPhone
            </h2>

            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Ouvrir l’application avec Safari.</li>
              <li>2. Appuyer sur le bouton Partager.</li>
              <li>3. Choisir “Sur l’écran d’accueil”.</li>
              <li>4. Valider l’ajout.</li>
            </ol>
          </article>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <MonitorSmartphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-extrabold text-[#03357A]">
                Note importante
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                L’installation PWA ne génère pas un fichier APK. Elle installe
                l’application depuis le navigateur, avec une icône sur l’écran
                d’accueil. Pour produire un vrai APK Android, il faudra ensuite
                utiliser Capacitor ou TWA.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}