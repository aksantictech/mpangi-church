"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

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
  label = "Installer",
  className,
}: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setIsStandalone(standalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

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
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    if (isIos) {
      alert(
        "Sur iPhone : ouvrez Safari, appuyez sur Partager, puis choisissez “Sur l’écran d’accueil”."
      );
      return;
    }

    alert(
      "Sur Android : utilisez Chrome sur l’adresse Vercel HTTPS, puis ouvrez le menu ⋮ et choisissez “Installer l’application” ou “Ajouter à l’écran d’accueil”."
    );
  }

  if (isStandalone) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
      }
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}