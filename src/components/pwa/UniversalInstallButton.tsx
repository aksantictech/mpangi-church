"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Share2,
  Smartphone,
  X,
} from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as any).standalone)
  );
}

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();

  return {
    ios: /iphone|ipad|ipod/.test(ua),
    android: /android/.test(ua),
    firefox: /firefox|fxios/.test(ua),
  };
}

export default function UniversalInstallButton({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [promptEvent, setPromptEvent] =
    useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const platform = useMemo(() => {
    if (typeof navigator === "undefined") {
      return { ios: false, android: false, firefox: false };
    }

    return detectPlatform();
  }, []);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;

    if (promptEvent) {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;

      if (result.outcome === "accepted") {
        setInstalled(true);
      }

      setPromptEvent(null);
      return;
    }

    setShowHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        disabled={installed}
        className={[
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
          installed
            ? "cursor-default bg-green-50 text-green-700"
            : "bg-[#03357A] text-white shadow-lg shadow-blue-900/15",
          compact ? "px-3 py-2 text-xs" : "",
          className,
        ].join(" ")}
      >
        {installed ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Application installée
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Installer l’application
          </>
        )}
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center">
          <section className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <Smartphone className="h-6 w-6" />
              </div>

              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Fermer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-4 text-2xl font-black text-[#03357A]">
              Installer l’application
            </h2>

            {platform.ios ? (
              <div className="mt-4 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
                <Share2 className="mr-2 inline h-4 w-4 text-[#03357A]" />
                Ouvrez <strong>Partager</strong>, puis choisissez
                <strong> Ajouter à l’écran d’accueil</strong>.
              </div>
            ) : platform.android ? (
              <div className="mt-4 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
                Ouvrez le menu du navigateur <strong>⋮</strong>, puis choisissez
                <strong> Installer l’application</strong> ou
                <strong> Ajouter à l’écran d’accueil</strong>.
              </div>
            ) : platform.firefox ? (
              <div className="mt-4 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
                Sur Firefox ordinateur, utilisez Chrome ou Edge pour
                l’installation PWA. Firefox Android peut proposer
                l’ajout à l’écran d’accueil.
              </div>
            ) : (
              <div className="mt-4 rounded-3xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
                Ouvrez le menu du navigateur, puis choisissez
                <strong> Installer cette application</strong>.
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
