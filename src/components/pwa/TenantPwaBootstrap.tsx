"use client";

import { useEffect } from "react";

function isLocalhost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

async function cleanupLocalPwa() {
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
  } catch {
    // Nettoyage local best-effort.
  }
}

export default function TenantPwaBootstrap() {
  useEffect(() => {
    const manifestHref = `/api/pwa/manifest?host=${encodeURIComponent(
      window.location.host
    )}`;

    let manifest = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]'
    );

    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      document.head.appendChild(manifest);
    }

    manifest.href = manifestHref;

    if (process.env.NODE_ENV === "development" && isLocalhost()) {
      cleanupLocalPwa();
      return;
    }

    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      window.location.protocol === "https:"
    ) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          })
          .catch(() => {
            // Le SW ne doit jamais casser l'interface.
          });
      };

      window.addEventListener("load", register);

      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
