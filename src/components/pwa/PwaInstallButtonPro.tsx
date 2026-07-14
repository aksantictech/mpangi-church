"use client";

import {
  CheckCircle2,
  Download,
  Loader2,
  MoreVertical,
  Share,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MpangiBeforeInstallPromptEvent } from "./PwaInstallCoordinator";

function detectIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window.navigator as Navigator & { standalone?: boolean })
      .standalone
  );
}

function detectStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean })
      .standalone === true
  );
}

export default function PwaInstallButtonPro() {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIos(detectIos());
    setInstalled(detectStandalone());
    setInstallable(Boolean(window.__mpangiPwaPrompt));

    const onState = (event: Event) => {
      const customEvent = event as CustomEvent<{
        installable?: boolean;
        installed?: boolean;
      }>;

      if (
        typeof customEvent.detail?.installable === "boolean"
      ) {
        setInstallable(customEvent.detail.installable);
      }

      if (
        typeof customEvent.detail?.installed === "boolean"
      ) {
        setInstalled(customEvent.detail.installed);
      }
    };

    window.addEventListener("mpangi:pwa-state", onState);

    return () => {
      window.removeEventListener("mpangi:pwa-state", onState);
    };
  }, []);

  const buttonLabel = useMemo(() => {
    if (installed) return "Application déjà installée";
    if (busy) return "Installation…";
    if (installable) return "Installer l’application";
    if (ios) return "Afficher les instructions iPhone";
    return "Instructions d’installation";
  }, [busy, installed, installable, ios]);

  async function handleInstall() {
    setMessage("");

    if (installed) return;

    const prompt =
      window.__mpangiPwaPrompt as
        | MpangiBeforeInstallPromptEvent
        | null
        | undefined;

    if (prompt) {
      setBusy(true);

      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;

        if (choice.outcome === "accepted") {
          setMessage(
            "Installation acceptée. L’icône sera ajoutée à votre appareil."
          );
        } else {
          setMessage(
            "Installation annulée. Vous pourrez réessayer."
          );
        }

        window.__mpangiPwaPrompt = null;
        setInstallable(false);
      } catch {
        setMessage(
          "Le navigateur n’a pas pu ouvrir l’installation. Utilisez son menu."
        );
      } finally {
        setBusy(false);
      }

      return;
    }

    if (ios) {
      setMessage(
        "Sur iPhone/iPad : touchez Partager, puis « Sur l’écran d’accueil »."
      );
      return;
    }

    setMessage(
      "Dans Chrome ou Edge : ouvrez le menu ⋮, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."
    );
  }

  return (
    <div className="pwa-install-card rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          {installed ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Smartphone className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-xl font-black text-[#03357A]">
            Installer Mpangi-church
          </h2>
          <p className="mt-1 break-words text-sm leading-6 text-slate-500">
            Accédez plus rapidement à votre espace depuis l’écran
            d’accueil.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstall}
        disabled={busy || installed}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : installable ? (
          <Download className="h-5 w-5" />
        ) : ios ? (
          <Share className="h-5 w-5" />
        ) : (
          <MoreVertical className="h-5 w-5" />
        )}

        {buttonLabel}
      </button>

      {message && (
        <div className="mt-4 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-semibold leading-6 text-slate-700">
          {message}
        </div>
      )}
    </div>
  );
}
