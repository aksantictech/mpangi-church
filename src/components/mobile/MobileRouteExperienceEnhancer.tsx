"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Experience =
  | "dashboard"
  | "public"
  | "scanner"
  | "notifications"
  | "install"
  | null;

function resolveExperience(pathname: string): Experience {
  if (
    pathname === "/dashboard" ||
    pathname === "/super-admin/dashboard" ||
    pathname === "/finance" ||
    pathname === "/patrimony" ||
    pathname === "/extensions"
  ) {
    return "dashboard";
  }

  if (/^\/church\/[^/]+\/?$/.test(pathname)) {
    return "public";
  }

  if (
    pathname.startsWith("/attendance/scanner") ||
    pathname === "/scanner"
  ) {
    return "scanner";
  }

  if (pathname === "/notifications") {
    return "notifications";
  }

  if (
    pathname === "/install" ||
    /^\/church\/[^/]+\/install\/?$/.test(pathname)
  ) {
    return "install";
  }

  return null;
}

function enhanceElement(element: Element, experience: Experience) {
  if (element.matches("header")) {
    element.classList.add("mpangi-mobile-header");
  }

  if (
    element.matches(
      '[class*="bg-gradient"], [class*="from-[#"], [class*="from-blue"]'
    ) &&
    element.querySelector("h1, h2")
  ) {
    element.classList.add(
      "mpangi-mobile-hero",
      "mpangi-mobile-safe-text"
    );
  }

  if (
    element.matches(
      '[class*="grid-cols-3"], [class*="grid-cols-4"], [class*="grid-cols-5"], [class*="grid-cols-6"]'
    ) &&
    element.querySelector(
      '[class*="rounded"], article, [class*="shadow"]'
    )
  ) {
    element.classList.add("mpangi-mobile-metric-grid");
  }

  if (
    element.matches(
      'nav, [role="tablist"], [class*="overflow-x-auto"]'
    ) &&
    element.querySelector("a, button")
  ) {
    element.classList.add("mpangi-mobile-chip-row");
  }

  if (
    element.matches(
      '[class*="justify-end"], [class*="justify-between"]'
    ) &&
    element.querySelector("a, button")
  ) {
    element.classList.add("mpangi-mobile-actions");
  }

  if (element.matches("h1, h2, h3, p, span")) {
    element.classList.add("mpangi-mobile-safe-text");
  }

  if (
    experience === "scanner" &&
    (
      element.matches("video, canvas") ||
      element.id.toLowerCase().includes("reader") ||
      element.className.toString().toLowerCase().includes("scanner")
    )
  ) {
    element.classList.add("mpangi-mobile-scanner");
  }

  if (
    experience === "notifications" &&
    element.matches(
      'article, [class*="rounded-2xl"], [class*="rounded-3xl"]'
    )
  ) {
    element.classList.add("mpangi-mobile-notification-card");
  }
}

function enhancePage(experience: Experience, root: ParentNode = document) {
  root
    .querySelectorAll(
      [
        "header",
        "nav",
        '[role="tablist"]',
        '[class*="overflow-x-auto"]',
        '[class*="bg-gradient"]',
        '[class*="from-[#"]',
        '[class*="from-blue"]',
        '[class*="grid-cols-3"]',
        '[class*="grid-cols-4"]',
        '[class*="grid-cols-5"]',
        '[class*="grid-cols-6"]',
        '[class*="justify-end"]',
        '[class*="justify-between"]',
        "article",
        "video",
        "canvas",
        "main h1",
        "main h2",
        "main h3",
        "main p",
        "main span",
      ].join(",")
    )
    .forEach((element) => enhanceElement(element, experience));
}

export default function MobileRouteExperienceEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const experience = resolveExperience(pathname);

    if (!experience) {
      delete document.body.dataset.mobileExperience;
      return;
    }

    document.body.dataset.mobileExperience = experience;
    enhancePage(experience);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          enhanceElement(node, experience);
          enhancePage(experience, node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      delete document.body.dataset.mobileExperience;
    };
  }, [pathname]);

  return null;
}
