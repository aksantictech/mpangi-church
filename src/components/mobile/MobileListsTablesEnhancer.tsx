"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LIST_ROUTES = [
  /^\/members\/?$/,
  /^\/settings\/users\/?$/,
  /^\/super-admin\/churches\/?$/,
  /^\/super-admin\/users\/?$/,
  /^\/departments\/?$/,
  /^\/events\/?$/,
  /^\/souls\/?$/,
  /^\/appointments\/?$/,
  /^\/notifications\/?$/,
  /^\/attendance\/reports\/[^/]+\/?$/,
  /^\/administration\/correspondence\/?$/,
  /^\/administration\/inbox\/?$/,
  /^\/administration\/tasks\/?$/,
  /^\/administration\/minutes\/?$/,
  /^\/administration\/transmissions\/?$/,
  /^\/inbox\/?$/,
  /^\/finance\/offerings\/?$/,
  /^\/finance\/expenses\/?$/,
  /^\/finance\/budgets\/?$/,
  /^\/finance\/reports\/?$/,
  /^\/finance\/donations\/?$/,
  /^\/patrimony\/assets\/?$/,
  /^\/patrimony\/maintenance\/?$/,
  /^\/patrimony\/movements\/?$/,
  /^\/extensions\/?$/,
  /^\/extensions\/activities\/?$/,
  /^\/extensions\/reports\/?$/,
  /^\/teachings\/?$/,
];

function matchesListRoute(pathname: string) {
  return LIST_ROUTES.some((pattern) => pattern.test(pathname));
}

function cleanLabel(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[:：]\s*$/, "")
    .trim();
}

function isComplexTable(table: HTMLTableElement) {
  const headerRows = table.tHead?.rows.length || 0;
  const hasSpans = Array.from(
    table.querySelectorAll("th, td")
  ).some((cell) => {
    const htmlCell = cell as HTMLTableCellElement;
    return htmlCell.colSpan > 1 || htmlCell.rowSpan > 1;
  });

  return headerRows > 1 || hasSpans;
}

function enhanceTable(table: HTMLTableElement) {
  if (table.dataset.mobileTableEnhanced === "true") return;

  table.dataset.mobileTableEnhanced = "true";

  const wrapper = table.parentElement;

  if (isComplexTable(table)) {
    table.classList.add("mobile-complex-table-enhanced");

    if (wrapper) {
      wrapper.classList.add("mobile-table-scroll-enhanced");
    }

    return;
  }

  const headerCells = Array.from(
    table.querySelectorAll("thead th")
  );

  if (headerCells.length === 0) {
    if (wrapper) {
      wrapper.classList.add("mobile-table-scroll-enhanced");
    }

    return;
  }

  const labels = headerCells.map((cell) =>
    cleanLabel(cell.textContent || "")
  );

  table.classList.add("mobile-card-table-enhanced");

  Array.from(table.tBodies).forEach((tbody) => {
    Array.from(tbody.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell, index) => {
        cell.dataset.mobileLabel =
          labels[index] || `Champ ${index + 1}`;

        cell.classList.add("mobile-safe-text");
      });
    });
  });
}

function enhanceElement(element: Element) {
  if (element instanceof HTMLTableElement) {
    enhanceTable(element);
    return;
  }

  if (
    element.matches(
      '[class*="grid-cols-3"], [class*="grid-cols-4"], [class*="grid-cols-5"], [class*="grid-cols-6"]'
    ) &&
    element.querySelector(
      'article, [class*="rounded"], [class*="shadow"]'
    )
  ) {
    element.classList.add("mobile-summary-grid-enhanced");
  }

  if (
    element.matches(
      'nav, [role="tablist"], [class*="overflow-x-auto"]'
    ) &&
    element.querySelector("a, button")
  ) {
    element.classList.add("mobile-filter-bar-enhanced");
  }

  if (
    element.matches(
      '[class*="justify-end"], [class*="justify-between"]'
    ) &&
    element.querySelector("a, button, form")
  ) {
    element.classList.add("mobile-list-actions-enhanced");
  }

  if (
    element.matches(
      'article, [class*="rounded-2xl"], [class*="rounded-3xl"], [class*="rounded-["]'
    ) &&
    element.querySelector("h2, h3")
  ) {
    element.classList.add("mobile-list-card-enhanced");
  }

  if (element.matches("h1, h2, h3, p, td, span")) {
    element.classList.add("mobile-list-safe-text");
  }
}

function enhancePage(root: ParentNode = document) {
  root
    .querySelectorAll(
      [
        "table",
        "nav",
        '[role="tablist"]',
        '[class*="overflow-x-auto"]',
        '[class*="grid-cols-3"]',
        '[class*="grid-cols-4"]',
        '[class*="grid-cols-5"]',
        '[class*="grid-cols-6"]',
        '[class*="justify-end"]',
        '[class*="justify-between"]',
        "article",
        "main h1",
        "main h2",
        "main h3",
        "main p",
      ].join(",")
    )
    .forEach(enhanceElement);
}

export default function MobileListsTablesEnhancer() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const active = matchesListRoute(pathname);

    if (!active) {
      delete document.body.dataset.mobileListRoute;
      return;
    }

    document.body.dataset.mobileListRoute = "true";
    document.body.classList.add("mobile-list-page-enhanced");

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
      delete document.body.dataset.mobileListRoute;
      document.body.classList.remove(
        "mobile-list-page-enhanced"
      );
    };
  }, [pathname]);

  return null;
}
