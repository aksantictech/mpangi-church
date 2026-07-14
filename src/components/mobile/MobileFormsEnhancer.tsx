"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FORM_ROUTES = [
  /^\/patrimony\/assets\/new\/?$/,
  /^\/patrimony\/assets\/[^/]+\/edit\/?$/,
  /^\/administration\/minutes\/new\/?$/,
  /^\/administration\/minutes\/[^/]+\/edit\/?$/,
  /^\/administration\/correspondence\/new\/?$/,
  /^\/extensions\/activities\/new\/?$/,
  /^\/finance\/expenses\/new\/?$/,
  /^\/finance\/offerings\/new\/?$/,
  /^\/administration\/tasks\/new\/?$/,
  /^\/administration\/tasks\/[^/]+\/edit\/?$/,
  /^\/patrimony\/maintenance\/new\/?$/,
  /^\/patrimony\/movements\/new\/?$/,
  /^\/administration\/transmissions\/new\/?$/,
  /^\/administration\/transmissions\/[^/]+\/edit\/?$/,
  /^\/finance\/budgets\/new\/?$/,
  /^\/finance\/budgets\/[^/]+\/edit\/?$/,
  /^\/extensions\/new\/?$/,
  /^\/extensions\/[^/]+\/edit\/?$/,
  /^\/settings\/users\/new\/?$/,
  /^\/super-admin\/users\/new\/?$/,
  /^\/login\/?$/,
];

function matchesFormRoute(pathname: string) {
  return FORM_ROUTES.some((pattern) => pattern.test(pathname));
}

function enhanceElement(element: Element) {
  if (element instanceof HTMLFormElement) {
    element.dataset.mobileEnhanced = "true";
    element.classList.add("mobile-page-content-enhanced");
  }

  if (
    element.matches(
      '[class*="grid-cols-2"], [class*="grid-cols-3"], [class*="grid-cols-4"], [class*="grid-cols-5"], [class*="grid-cols-6"]'
    )
  ) {
    element.classList.add("mobile-form-grid-enhanced");
  }

  if (
    element.matches(
      '[class*="justify-end"], [class*="justify-between"], [class*="items-end"]'
    ) &&
    element.querySelector("button, a")
  ) {
    element.classList.add("mobile-form-actions-enhanced");
  }

  if (
    element.matches(
      '[class*="rounded-2xl"], [class*="rounded-3xl"], [class*="rounded-["]'
    ) &&
    element.querySelector("input, select, textarea")
  ) {
    element.classList.add("mobile-form-card-enhanced");
  }

  if (element.matches("h1, h2, h3, p, label")) {
    element.classList.add("mobile-break-text-enhanced");
  }

  if (element.matches("button, a[role='button']")) {
    element.classList.add("mobile-form-button-enhanced");
  }
}

function enhancePage(root: ParentNode = document) {
  const selectors = [
    "form",
    "form *",
    "main h1",
    "main h2",
    "main h3",
    "main p",
  ].join(",");

  root.querySelectorAll(selectors).forEach(enhanceElement);
}

export default function MobileFormsEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    document.body.dataset.mobileRoute = pathname;

    const active = matchesFormRoute(pathname);

    if (!active) {
      delete document.body.dataset.mobileFormRoute;
      return;
    }

    document.body.dataset.mobileFormRoute = "true";
    enhancePage();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          enhanceElement(node);
          enhancePage(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      delete document.body.dataset.mobileFormRoute;
    };
  }, [pathname]);

  return null;
}
