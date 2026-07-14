"use client";

import { useEffect } from "react";

export type MpangiBeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

declare global {
  interface Window {
    __mpangiPwaPrompt?: MpangiBeforeInstallPromptEvent | null;
  }
}

function dispatchState(detail: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent("mpangi:pwa-state", { detail })
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean })
      .standalone === true
  );
}

export default function PwaInstallCoordinator() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch (error) {
        console.warn(
          "Mpangi-church: service worker non enregistré.",
          error
        );
      }
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      window.__mpangiPwaPrompt =
        event as MpangiBeforeInstallPromptEvent;

      dispatchState({
        installable: true,
        installed: false,
      });
    };

    const onAppInstalled = () => {
      window.__mpangiPwaPrompt = null;

      dispatchState({
        installable: false,
        installed: true,
      });
    };

    registerServiceWorker();

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", onAppInstalled);

    dispatchState({
      installable: Boolean(window.__mpangiPwaPrompt),
      installed: isStandalone(),
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );
      window.removeEventListener(
        "appinstalled",
        onAppInstalled
      );
    };
  }, []);

  return null;
}
