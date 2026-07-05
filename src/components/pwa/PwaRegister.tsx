"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
      })
      .catch(() => {
        // On garde silencieux pour ne pas bloquer l'app.
      });
  }, []);

  return null;
}