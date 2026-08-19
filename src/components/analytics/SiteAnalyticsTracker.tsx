"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function SiteAnalyticsTracker() {
  const pathname = usePathname() || "/";
  const lastTracked = useRef("");

  useEffect(() => {
    if (pathname.startsWith("/super-admin")) return;
    if (pathname.startsWith("/api/")) return;

    const key = `${window.location.host}:${pathname}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
