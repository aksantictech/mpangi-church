"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, MonitorSmartphone, Share, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";

function isChromeLike() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();

  return /chrome|chromium|crios|edg/.test(ua);
}

export default function PwaInstallCard() {
  const { canInstall, isStandalone, isIos, isAndroid, promptInstall } =
    usePwaInstall();
  const [status, setStatus] = useState<
    "idle" | "accepted" | "dismissed" | "unavailable" | "standalone"
  >("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);

    const handleReady = () => setReady(true);
    window.addEventListener("mpangi-pwa-install-ready", handleReady);

    return () => window.removeEventListener("mpangi-pwa-install-ready", handleReady);
  }, []);

  async function handleInstall() {
    const outcome = await promptInstall();
    setStatus(outcome);
  }

  if (isStandalone) {
    return (
      <section className="rounded-[2rem] border border-green-100 bg-green-50 p-5 text-green-800 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-1 h-7 w-7 shrink-0" />
          <div>
            <h2 className="text-xl font-black">Application déjà installée</h2>
            <p className="mt-2 text-sm leading-7 font-semibold">
              Mpangi-church est déjà ouverte comme application mobile.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#03357A] text-white">
            <MonitorSmartphone className="h-7 w-7" />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
              Application mobile
            </p>
            <h1 className="mt-2 text-2xl font-black text-[#03357A] sm:text-3xl">
              Installer Mpangi-church
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Installez l’application sur votre téléphone pour l’utiliser comme une vraie app :
              icône sur l’écran d’accueil, ouverture rapide, mode plein écran et accès mobile optimisé.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={!canInstall}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-6 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Download className="h-5 w-5" />
          Installer l’application
        </button>
      </div>

      {!canInstall && !isIos && ready && (
        <div className="mt-5 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
          <p className="font-black text-[#03357A]">Le bouton direct n’est pas disponible pour le moment.</p>
          <p className="mt-1">
            Sur Android, ouvrez le site dans Chrome, appuyez sur le menu ⋮ puis choisissez
            <strong> Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.
          </p>
          {!isChromeLike() && isAndroid && (
            <p className="mt-2 font-bold text-orange-700">
              Utilisez Chrome Android pour avoir le bouton d’installation PWA fiable.
            </p>
          )}
        </div>
      )}

      {isIos && (
        <div className="mt-5 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
          <p className="flex items-center gap-2 font-black text-[#03357A]">
            <Share className="h-4 w-4" />
            Installation sur iPhone / iPad
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Ouvrez ce site avec Safari.</li>
            <li>Appuyez sur le bouton Partager.</li>
            <li>Choisissez “Sur l’écran d’accueil”.</li>
            <li>Validez avec “Ajouter”.</li>
          </ol>
        </div>
      )}

      {status === "dismissed" && (
        <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-orange-700">
          Installation annulée. Vous pouvez relancer l’installation depuis le menu du navigateur.
        </p>
      )}

      {status === "accepted" && (
        <p className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
          Installation lancée avec succès.
        </p>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Icône mobile", "L’app apparaît sur l’écran d’accueil."],
          ["Ouverture rapide", "L’expérience ressemble à une vraie app."],
          ["Compatible églises", "Le logo et le nom suivent le sous-domaine."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-[#DCEAF5] p-4">
            <Smartphone className="h-5 w-5 text-[#03357A]" />
            <h3 className="mt-3 font-black text-[#03357A]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
