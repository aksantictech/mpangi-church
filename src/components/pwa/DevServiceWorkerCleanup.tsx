"use client";

import { useEffect } from "react";

const DEV_RELOAD_KEY = "mpangi-dev-pwa-cleanup-reload";

function isLocalhost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "0.0.0.0"
  );
}

export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      !isLocalhost()
    ) {
      return;
    }

    let cancelled = false;

    async function cleanup() {
      try {
        const hadController =
          "serviceWorker" in navigator &&
          Boolean(navigator.serviceWorker.controller);

        const registrations =
          "serviceWorker" in navigator
            ? await navigator.serviceWorker.getRegistrations()
            : [];

        await Promise.all(
          registrations.map((registration) =>
            registration.unregister()
          )
        );

        const cacheKeys =
          "caches" in window ? await caches.keys() : [];

        await Promise.all(
          cacheKeys.map((cacheKey) =>
            caches.delete(cacheKey)
          )
        );

        if (cancelled) return;

        const cleanupWasNecessary =
          hadController ||
          registrations.length > 0 ||
          cacheKeys.length > 0;

        if (
          cleanupWasNecessary &&
          sessionStorage.getItem(DEV_RELOAD_KEY) !== "1"
        ) {
          sessionStorage.setItem(DEV_RELOAD_KEY, "1");
          window.location.reload();
          return;
        }

        if (!cleanupWasNecessary) {
          sessionStorage.removeItem(DEV_RELOAD_KEY);
        }
      } catch {
        // Le nettoyage local ne doit pas bloquer l’application.
      }
    }

    void cleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}