"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    fumsData?: unknown[][];
    fums?: (...args: unknown[]) => void;
  }
}

function ensureFumsQueue() {
  window.fumsData = window.fumsData || [];

  window.fums =
    window.fums ||
    function (...args: unknown[]) {
      window.fumsData?.push(args);
    };
}

export default function BibleFumsTracker({
  token,
}: {
  token: string | null;
}) {
  useEffect(() => {
    if (!token) return;

    ensureFumsQueue();
    window.fums?.("trackView", token);
  }, [token]);

  return (
    <>
      <Script id="api-bible-fums-bootstrap" strategy="afterInteractive">
        {`
          window.fumsData = window.fumsData || [];
          window.fums = window.fums || function () {
            window.fumsData.push(arguments);
          };
        `}
      </Script>

      <Script
        src="https://pkg.api.bible/fumsV3.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}
