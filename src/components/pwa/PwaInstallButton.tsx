"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type PwaInstallButtonProps = {
  label?: string;
  className?: string;
};

export default function PwaInstallButton({
  label = "Installer l’application",
  className,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  async function handleInstall() {
    setMessage("");

    if (isStandalone) {
      setMessage("L’application est déjà installée.");
      return;
    }

    if (!installPrompt) {
      setMessage(
        "Si le bouton ne lance pas l’installation, ouvrez le menu du navigateur puis choisissez “Installer l’application” ou “Ajouter à l’écran d’accueil”."
      );
      return;
    }

    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setMessage("Installation lancée.");
      setInstallPrompt(null);
    } else {
      setMessage("Installation annulée.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleInstall}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-[#022B63]"
        }
      >
        {isStandalone ? (
          <Smartphone className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}

        {isStandalone ? "Application installée" : label}
      </button>

      {message && (
        <p className="mt-2 max-w-md text-xs font-semibold text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}