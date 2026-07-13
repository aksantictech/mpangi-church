"use client";

import { useEffect } from "react";

async function cleanupLocalDevCaches() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  if (!isLocalhost) return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    }

    if ("caches" in window) {
      const keys = await caches.keys();

      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    sessionStorage.setItem("mpangi-dev-cache-cleaned", "true");
  } catch {
    // Nettoyage best-effort uniquement en développement local.
  }
}

export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    cleanupLocalDevCaches();

    const timers = [
      window.setTimeout(cleanupLocalDevCaches, 800),
      window.setTimeout(cleanupLocalDevCaches, 2500),
      window.setTimeout(cleanupLocalDevCaches, 5000),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return null;
}
