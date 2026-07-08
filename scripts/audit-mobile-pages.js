const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");
const OUT_MD = path.join(ROOT, "MOBILE_PAGE_AUDIT_REPORT.md");
const OUT_JSON = path.join(ROOT, "mobile-page-audit-report.json");

const PAGE_FILES = new Set(["page.tsx"]);

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      walk(fullPath, results);
    } else if (PAGE_FILES.has(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function routeKeyForFile(filePath) {
  const rel = path.relative(APP_DIR, filePath).replaceAll("\\", "/");

  const route = rel
    .replace(/\/page\.tsx$/, "")
    .replace(/^page\.tsx$/, "")
    .replace(/^\(.*?\)\//, "");

  return route ? `/${route}` : "/";
}

function countMatches(source, regex) {
  return (source.match(regex) || []).length;
}

function classifyPriority(route, score) {
  const highValuePrefixes = [
    "/dashboard",
    "/members",
    "/attendance",
    "/settings/users",
    "/administration",
    "/finance",
    "/patrimony",
    "/teachings",
    "/notifications",
  ];

  const highValue = highValuePrefixes.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`)
  );

  if (score >= 7 || (highValue && score >= 4)) return "P1";
  if (score >= 3) return "P2";
  return "P3";
}

function detectIssues(source) {
  const tables = countMatches(source, /<table\b/g);
  const minW = countMatches(source, /min-w-\[/g);
  const overflowX = countMatches(source, /overflow-x-auto/g);
  const fixedGrid = countMatches(source, /grid-cols-\d|md:grid-cols|lg:grid-cols|xl:grid-cols/g);
  const fixedWidths = countMatches(source, /w-\[\d|min-w-\[\d|max-w-\[\d/g);
  const largeText = countMatches(source, /text-4xl|text-5xl|text-6xl/g);
  const longForms = countMatches(source, /<input\b|<select\b|<textarea\b/g);
  const buttons = countMatches(source, /<button\b|<Link\b/g);
  const sticky = countMatches(source, /sticky|fixed/g);

  const issues = [];

  if (tables > 0) issues.push("table_desktop");
  if (minW > 0) issues.push("min_width_desktop");
  if (overflowX > 0) issues.push("horizontal_scroll");
  if (fixedGrid >= 3) issues.push("complex_grid");
  if (fixedWidths > 0) issues.push("fixed_width");
  if (largeText > 0) issues.push("large_title");
  if (longForms >= 8) issues.push("long_form_mobile");
  if (buttons >= 12) issues.push("many_actions");
  if (sticky >= 2) issues.push("multiple_sticky_fixed");

  const score =
    tables * 3 +
    minW * 2 +
    Math.max(0, fixedGrid - 2) +
    fixedWidths * 2 +
    Math.max(0, longForms - 6) +
    Math.max(0, buttons - 10) +
    largeText;

  return {
    tables,
    minW,
    overflowX,
    fixedGrid,
    fixedWidths,
    largeText,
    longForms,
    buttons,
    sticky,
    issues,
    score,
  };
}

const files = walk(APP_DIR);

const rows = files.map((filePath) => {
  const source = fs.readFileSync(filePath, "utf8");
  const route = routeKeyForFile(filePath);
  const rel = path.relative(ROOT, filePath).replaceAll("\\", "/");
  const metrics = detectIssues(source);

  return {
    file: rel,
    route,
    priority: classifyPriority(route, metrics.score),
    ...metrics,
  };
}).sort((a, b) => {
  const order = { P1: 0, P2: 1, P3: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  return b.score - a.score;
});

const p1 = rows.filter((row) => row.priority === "P1");
const p2 = rows.filter((row) => row.priority === "P2");
const tablePages = rows.filter((row) => row.tables > 0);
const formPages = rows.filter((row) => row.longForms >= 8);

const markdown = [
  "# Mpangi-church — Audit mobile page par page",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "## Résumé",
  "",
  `- Pages analysées: ${rows.length}`,
  `- Priorité P1: ${p1.length}`,
  `- Priorité P2: ${p2.length}`,
  `- Pages avec tables: ${tablePages.length}`,
  `- Pages avec formulaires longs: ${formPages.length}`,
  "",
  "## Priorité P1 — à corriger d’abord",
  "",
  p1.length === 0
    ? "Aucune page P1 détectée."
    : [
        "| Route | Fichier | Score | Problèmes détectés |",
        "|---|---|---:|---|",
        ...p1.map(
          (row) =>
            `| \`${row.route}\` | \`${row.file}\` | ${row.score} | ${row.issues.join(", ") || "-"} |`
        ),
      ].join("\n"),
  "",
  "## Pages avec tables",
  "",
  tablePages.length === 0
    ? "Aucune table détectée."
    : [
        "| Route | Fichier | Tables | min-w | overflow-x |",
        "|---|---|---:|---:|---:|",
        ...tablePages.map(
          (row) =>
            `| \`${row.route}\` | \`${row.file}\` | ${row.tables} | ${row.minW} | ${row.overflowX} |`
        ),
      ].join("\n"),
  "",
  "## Pages avec formulaires longs",
  "",
  formPages.length === 0
    ? "Aucun formulaire long détecté."
    : [
        "| Route | Fichier | Champs | Actions |",
        "|---|---|---:|---:|",
        ...formPages.map(
          (row) =>
            `| \`${row.route}\` | \`${row.file}\` | ${row.longForms} | ${row.buttons} |`
        ),
      ].join("\n"),
  "",
  "## Détail complet",
  "",
  "| Priorité | Route | Fichier | Score | Tables | Forms | Grids | Widths | Issues |",
  "|---|---|---|---:|---:|---:|---:|---:|---|",
  ...rows.map(
    (row) =>
      `| ${row.priority} | \`${row.route}\` | \`${row.file}\` | ${row.score} | ${row.tables} | ${row.longForms} | ${row.fixedGrid} | ${row.fixedWidths} | ${row.issues.join(", ") || "-"} |`
  ),
  "",
  "## Règles de correction mobile",
  "",
  "1. Transformer les tables critiques en cartes mobiles, garder la table seulement à partir de `md` ou `lg`.",
  "2. Réduire les titres `text-4xl` en `text-2xl sm:text-3xl` sur mobile.",
  "3. Remplacer les actions nombreuses par une barre sticky ou un menu d’actions.",
  "4. Découper les formulaires longs en sections pliables.",
  "5. Limiter les `min-w-[...]` aux vues desktop : `hidden md:block` ou `md:min-w-[...]`.",
  "",
].join("\n");

fs.writeFileSync(OUT_MD, markdown, "utf8");
fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");

console.log("");
console.log("Audit mobile terminé.");
console.log(`Rapport Markdown : ${path.relative(ROOT, OUT_MD)}`);
console.log(`Rapport JSON     : ${path.relative(ROOT, OUT_JSON)}`);
console.log("");
console.log(`Pages P1 : ${p1.length}`);
console.log(`Pages avec tables : ${tablePages.length}`);
console.log(`Pages avec formulaires longs : ${formPages.length}`);

if (p1.length > 0) {
  console.log("");
  console.log("Top pages P1 :");
  for (const row of p1.slice(0, 15)) {
    console.log(`- ${row.route} (${row.score}) -> ${row.file}`);
  }
}
