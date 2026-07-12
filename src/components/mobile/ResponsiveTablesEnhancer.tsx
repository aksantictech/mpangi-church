"use client";

import { useEffect } from "react";

function normalizeLabel(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function enhanceTable(table: HTMLTableElement) {
  if (table.dataset.mobileEnhanced === "true") return;
  if (table.dataset.mobileTable === "off") return;

  const headers = Array.from(table.querySelectorAll("thead th")).map((header) =>
    normalizeLabel(header.textContent || "")
  );

  if (!headers.length) return;

  table.classList.add("mpangi-responsive-table");
  table.dataset.mobileEnhanced = "true";

  const rows = Array.from(table.querySelectorAll("tbody tr"));

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));

    cells.forEach((cell, index) => {
      const label = headers[index] || `Champ ${index + 1}`;

      if (!cell.getAttribute("data-label")) {
        cell.setAttribute("data-label", label);
      }
    });
  });
}

function enhanceAllTables(root: ParentNode = document) {
  const tables = Array.from(root.querySelectorAll("table"));

  tables.forEach((table) => {
    if (table instanceof HTMLTableElement) {
      enhanceTable(table);
    }
  });
}

export default function ResponsiveTablesEnhancer() {
  useEffect(() => {
    enhanceAllTables();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches("table")) {
            enhanceTable(node as HTMLTableElement);
          }

          enhanceAllTables(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
