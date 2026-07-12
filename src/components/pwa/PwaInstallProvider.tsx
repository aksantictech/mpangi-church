"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type PwaInstallContextValue = {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isAndroid: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable" | "standalone">;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function detectStandalone() {
  if (typeof window === "undefined") return false;

  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean((window.navigator as any).standalone);

  return standaloneDisplay || iosStandalone;
}

function detectIos() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent.toLowerCase();

  return /iphone|ipad|ipod/.test(ua);
}

function detectAndroid() {
  if (typeof window === "undefined") return false;

  return /android/.test(window.navigator.userAgent.toLowerCase());
}

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    setIsIos(detectIos());
    setIsAndroid(detectAndroid());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      window.dispatchEvent(new CustomEvent("mpangi-pwa-install-ready"));
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      window.dispatchEvent(new CustomEvent("mpangi-pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isStandalone,
      isStandalone,
      isIos,
      isAndroid,
      promptInstall: async () => {
        if (isStandalone) return "standalone";
        if (!deferredPrompt) return "unavailable";

        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);

        return choice.outcome;
      },
    }),
    [deferredPrompt, isStandalone, isIos, isAndroid]
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    return {
      canInstall: false,
      isStandalone: false,
      isIos: false,
      isAndroid: false,
      promptInstall: async () => "unavailable" as const,
    };
  }

  return context;
}
