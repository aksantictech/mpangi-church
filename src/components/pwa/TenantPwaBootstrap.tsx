"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __mpangiPwaRegistrationStarted?: boolean;
  }
}

export default function TenantPwaBootstrap() {
  useEffect(() => {
    const manifestHref =
      `/api/pwa/manifest?host=${encodeURIComponent(
        window.location.host
      )}`;

    let manifest =
      document.querySelector<HTMLLinkElement>(
        'link[rel="manifest"]'
      );

    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      document.head.appendChild(manifest);
    }

    manifest.href = manifestHref;

    // Aucun service worker pendant le développement local.
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (
      !("serviceWorker" in navigator) ||
      window.location.protocol !== "https:"
    ) {
      return;
    }

    if (window.__mpangiPwaRegistrationStarted) {
      return;
    }

    window.__mpangiPwaRegistrationStarted = true;

    async function registerServiceWorker() {
      try {
        const existingRegistration =
          await navigator.serviceWorker.getRegistration("/");

        if (existingRegistration) {
          await existingRegistration.update();
          return;
        }

        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch {
        window.__mpangiPwaRegistrationStarted = false;
      }
    }

    if (document.readyState === "complete") {
      void registerServiceWorker();
      return;
    }

    const handleLoad = () => {
      void registerServiceWorker();
    };

    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  return null;
}