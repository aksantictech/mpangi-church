"use client";

import { useEffect } from "react";

function hasUsefulRows(table: HTMLTableElement) {
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));

  return bodyRows.some((row) => {
    const text = row.textContent?.replace(/\s+/g, " ").trim() || "";
    return text.length > 0;
  });
}

function getColumnCount(table: HTMLTableElement) {
  return table.querySelectorAll("thead th").length || table.querySelectorAll("tr:first-child td").length || 1;
}

function ensureEmptyState(table: HTMLTableElement) {
  if (table.dataset.emptyEnhancer === "off") return;

  const wrapper = table.closest("[data-empty-table-wrapper]");
  const target = wrapper || table.parentElement;

  if (!target) return;

  const already = target.querySelector(":scope > .mpangi-auto-empty-state");

  if (hasUsefulRows(table)) {
    if (already) already.remove();
    return;
  }

  if (already) return;

  const message =
    table.dataset.emptyMessage ||
    "Aucune donnée enregistrée pour le moment.";

  const empty = document.createElement("div");
  empty.className = "mpangi-auto-empty-state";
  empty.innerHTML = `
    <div class="mpangi-auto-empty-icon">—</div>
    <div>
      <p class="mpangi-auto-empty-title">Aucune donnée</p>
      <p class="mpangi-auto-empty-description">${message}</p>
    </div>
  `;

  if (table.nextSibling) {
    target.insertBefore(empty, table.nextSibling);
  } else {
    target.appendChild(empty);
  }

  table.dataset.emptyColumnCount = String(getColumnCount(table));
}

function enhanceAllTables(root: ParentNode = document) {
  const tables = Array.from(root.querySelectorAll("table"));

  tables.forEach((table) => {
    if (table instanceof HTMLTableElement) {
      ensureEmptyState(table);
    }
  });
}

export default function EmptyTablesEnhancer() {
  useEffect(() => {
    enhanceAllTables();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches("table")) {
            ensureEmptyState(node as HTMLTableElement);
          }

          enhanceAllTables(node);
        });

        if (mutation.type === "childList") {
          enhanceAllTables();
        }
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
