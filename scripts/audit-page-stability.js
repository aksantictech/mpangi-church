const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");
const OUT_MD = path.join(ROOT, "PAGE_STABILITY_REPORT.md");
const OUT_JSON = path.join(ROOT, "page-stability-report.json");

const EXCLUDED_SEGMENTS = new Set(["api", "_components"]);

const PUBLIC_PREFIXES = [
  "/login",
  "/logout",
  "/install",
  "/offline",
  "/unauthorized",
  "/church",
];

function exists(file) {
  return fs.existsSync(file);
}

function read(file) {
  return exists(file) ? fs.readFileSync(file, "utf8") : "";
}

function walk(dir, results = []) {
  if (!exists(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_SEGMENTS.has(entry.name)) continue;
      if (entry.name.startsWith("_")) continue;
      walk(fullPath, results);
    } else if (entry.name === "page.tsx") {
      results.push(fullPath);
    }
  }

  return results;
}

function routeForFile(filePath) {
  const rel = path.relative(APP_DIR, filePath).replaceAll("\\", "/");
  const route = rel.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return route ? `/${route}` : "/";
}

function sourceUsesShell(source) {
  return (
    source.includes("<AppShell") ||
    source.includes("<SuperAdminShell") ||
    source.includes('from "@/components/layout/AppShell"') ||
    source.includes('from "@/components/layout/SuperAdminShell"')
  );
}

function nearestFiles(filePath, fileName) {
  const files = [];
  let current = path.dirname(filePath);

  while (current.startsWith(APP_DIR)) {
    const candidate = path.join(current, fileName);

    if (exists(candidate)) files.push(candidate);

    if (current === APP_DIR) break;
    current = path.dirname(current);
  }

  return files;
}

function isRedirectOnly(source) {
  return (
    source.includes('from "next/navigation"') &&
    source.includes("redirect(") &&
    !source.includes("return (")
  );
}

function routeType(route, source) {
  if (isRedirectOnly(source)) return "redirect";

  if (route.startsWith("/super-admin")) return "super-admin";

  if (
    PUBLIC_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`)
    )
  ) {
    return "public";
  }

  return "church-app";
}

function rootLayoutSource() {
  return read(path.join(APP_DIR, "layout.tsx"));
}

const rootLayout = rootLayoutSource();
const hasGlobalEmptyTablesEnhancer = rootLayout.includes("EmptyTablesEnhancer");

function detectIssues(filePath) {
  const route = routeForFile(filePath);
  const source = read(filePath);
  const layouts = nearestFiles(filePath, "layout.tsx");
  const errors = nearestFiles(filePath, "error.tsx");
  const loadings = nearestFiles(filePath, "loading.tsx");
  const notFounds = nearestFiles(filePath, "not-found.tsx");

  const layoutSources = layouts.map(read).join("\n");
  const errorSources = errors.map(read).join("\n");
  const loadingSources = loadings.map(read).join("\n");

  const type = routeType(route, source);
  const redirectOnly = type === "redirect";
  const pageHasShell = sourceUsesShell(source);
  const layoutHasShell = sourceUsesShell(layoutSources);
  const hasShell = pageHasShell || layoutHasShell;
  const hasRouteError = errors.length > 0 || source.includes("ErrorState") || errorSources.includes("RouteErrorView");
  const hasRouteLoading = loadings.length > 0 || loadingSources.includes("RouteLoadingView");
  const hasNotFound = notFounds.length > 0;
  const hasTable = /<table\b/.test(source);

  const issues = [];
  const warnings = [];

  if (!redirectOnly && type !== "public" && !hasShell) {
    issues.push("missing_app_shell");
  }

  if (
    !redirectOnly &&
    type === "super-admin" &&
    !source.includes("SuperAdminShell") &&
    !layoutSources.includes("SuperAdminShell")
  ) {
    issues.push("missing_super_admin_shell");
  }

  if (
    !redirectOnly &&
    type === "church-app" &&
    !source.includes("AppShell") &&
    !layoutSources.includes("AppShell")
  ) {
    issues.push("missing_church_app_shell");
  }

  if (/bg-black|bg-\[#000\]|bg-slate-950|bg-neutral-950|bg-zinc-950/.test(source)) {
    issues.push("black_background");
  }

  if (
    !redirectOnly &&
    hasTable &&
    !/md:hidden|MobileRecordCard|ResponsiveDataSection|MobileListShell/.test(source) &&
    !rootLayout.includes("ResponsiveTablesEnhancer")
  ) {
    warnings.push("desktop_table_without_mobile_cards");
  }

  const hasVisibleEmptyState =
    /Aucun|aucune|EmptyState|empty|Aucune donnée/i.test(source) ||
    (hasTable && hasGlobalEmptyTablesEnhancer);

  if (!redirectOnly && !hasVisibleEmptyState && (hasTable || /\.map\(/.test(source))) {
    warnings.push("no_visible_empty_state");
  }

  const hasDataCalls = /from\(|select\(|insert\(|update\(|delete\(/.test(source);
  const hasLocalErrorHandling = /try|catch|ErrorState|error/i.test(source);

  if (!redirectOnly && hasDataCalls && !hasLocalErrorHandling && !hasRouteError) {
    warnings.push("no_error_state_hint");
  }

  if (!redirectOnly && !hasRouteLoading && hasDataCalls) {
    warnings.push("no_loading_state_hint");
  }

  return {
    route,
    file: path.relative(ROOT, filePath).replaceAll("\\", "/"),
    type,
    redirectOnly,
    pageHasShell,
    layoutHasShell,
    hasShell,
    hasRouteError,
    hasRouteLoading,
    hasNotFound,
    issues,
    warnings,
    score: issues.length * 5 + warnings.length,
  };
}

const files = walk(APP_DIR);
const rows = files.map(detectIssues).sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return a.route.localeCompare(b.route);
});

const critical = rows.filter((row) => row.issues.length > 0);
const warnings = rows.filter((row) => row.warnings.length > 0);

const criticalTable =
  critical.length === 0
    ? "Aucune page critique détectée."
    : [
        "| Route | Type | Fichier | Problèmes |",
        "|---|---|---|---|",
        ...critical.map(
          (row) =>
            `| \`${row.route}\` | ${row.type} | \`${row.file}\` | ${row.issues.join(", ")} |`
        ),
      ].join("\n");

const warningsTable =
  warnings.length === 0
    ? "Aucun avertissement."
    : [
        "| Route | Fichier | Avertissements |",
        "|---|---|---|",
        ...warnings.map(
          (row) =>
            `| \`${row.route}\` | \`${row.file}\` | ${row.warnings.join(", ")} |`
        ),
      ].join("\n");

const md = [
  "# Mpangi-church — Rapport stabilité pages/layouts",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "## Résumé",
  "",
  `- Pages analysées : ${rows.length}`,
  `- Pages critiques : ${critical.length}`,
  `- Pages avec avertissements : ${warnings.length}`,
  "",
  "## Couverture globale",
  "",
  `- EmptyTablesEnhancer actif : ${hasGlobalEmptyTablesEnhancer ? "oui" : "non"}`,
  `- ResponsiveTablesEnhancer actif : ${rootLayout.includes("ResponsiveTablesEnhancer") ? "oui" : "non"}`,
  "",
  "## Pages critiques",
  "",
  criticalTable,
  "",
  "## Avertissements",
  "",
  warningsTable,
  "",
  "## Détail complet",
  "",
  "| Route | Type | Shell | Error | Loading | NotFound | Score | Issues | Warnings |",
  "|---|---|---:|---:|---:|---:|---:|---|---|",
  ...rows.map(
    (row) =>
      `| \`${row.route}\` | ${row.type} | ${row.hasShell ? "oui" : "non"} | ${row.hasRouteError ? "oui" : "non"} | ${row.hasRouteLoading ? "oui" : "non"} | ${row.hasNotFound ? "oui" : "non"} | ${row.score} | ${row.issues.join(", ") || "-"} | ${row.warnings.join(", ") || "-"} |`
  ),
  "",
].join("\n");

fs.writeFileSync(OUT_MD, md, "utf8");
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");

console.log("");
console.log("Audit stabilité terminé.");
console.log("Rapport :", path.relative(ROOT, OUT_MD));
console.log("JSON    :", path.relative(ROOT, OUT_JSON));
console.log("");
console.log(`Pages critiques : ${critical.length}`);
console.log(`Avertissements  : ${warnings.length}`);

if (critical.length) {
  console.log("");
  console.log("Top critiques :");
  for (const row of critical.slice(0, 20)) {
    console.log(`- ${row.route} -> ${row.issues.join(", ")}`);
  }
}
