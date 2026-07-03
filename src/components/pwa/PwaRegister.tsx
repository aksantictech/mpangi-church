"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function registerServiceWorker() {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Ne bloque pas l'application si le SW échoue.
      }
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