"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function cleanDevelopmentPwaCache() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );

        if ("caches" in window) {
          const cacheNames = await caches.keys();

          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        }
      } catch {
        // Ne bloque pas l'application en développement.
      }
    }

    async function registerServiceWorker() {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Ne bloque pas l'application si le service worker échoue.
      }
    }

    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
      void cleanDevelopmentPwaCache();
      return;
    }

    if (document.readyState === "complete") {
      void registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);

      return () => {
        window.removeEventListener("load", registerServiceWorker);
      };
    }
  }, []);

  return null;
}