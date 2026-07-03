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
  label = "Installer l’application",
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

    function handleAppInstalled() {
      setIsStandalone(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (isStandalone) {
      alert("L’application est déjà installée.");
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    if (isIos) {
      alert(
        "Sur iPhone : ouvrez le site avec Safari, appuyez sur Partager, puis choisissez “Sur l’écran d’accueil”."
      );
      return;
    }

    alert(
      "Sur Android : ouvrez le site avec Chrome, puis appuyez sur le menu ⋮ et choisissez “Installer l’application” ou “Ajouter à l’écran d’accueil”. Si l’option n’apparaît pas, vérifiez que vous êtes bien sur l’URL HTTPS de Vercel."
    );
  }

  if (isStandalone) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
      }
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}