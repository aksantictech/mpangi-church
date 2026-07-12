const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");
const OUT_MD = path.join(ROOT, "ROUTE_STATES_COVERAGE_REPORT.md");

function exists(file) {
  return fs.existsSync(file);
}

function walkPages(dir, results = []) {
  if (!exists(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      walkPages(fullPath, results);
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

function nearest(filePath, fileName) {
  let current = path.dirname(filePath);

  while (current.startsWith(APP_DIR)) {
    const candidate = path.join(current, fileName);

    if (exists(candidate)) return candidate;

    if (current === APP_DIR) break;
    current = path.dirname(current);
  }

  return null;
}

const rows = walkPages(APP_DIR).map((page) => ({
  route: routeForFile(page),
  file: path.relative(ROOT, page).replaceAll("\\", "/"),
  error: nearest(page, "error.tsx"),
  loading: nearest(page, "loading.tsx"),
  notFound: nearest(page, "not-found.tsx"),
}));

const missing = rows.filter((row) => !row.error || !row.loading);

const md = [
  "# Couverture états de routes",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  `- Pages analysées : ${rows.length}`,
  `- Pages sans error ou loading proche : ${missing.length}`,
  "",
  "## Pages à vérifier",
  "",
  missing.length === 0
    ? "Toutes les pages ont une couverture error/loading via leur segment ou un parent."
    : [
        "| Route | Error | Loading | Fichier |",
        "|---|---:|---:|---|",
        ...missing.map(
          (row) =>
            `| \`${row.route}\` | ${row.error ? "oui" : "non"} | ${row.loading ? "oui" : "non"} | \`${row.file}\` |`
        ),
      ].join("\n"),
  "",
].join("\n");

fs.writeFileSync(OUT_MD, md, "utf8");

console.log("Audit états routes terminé.");
console.log("Rapport :", path.relative(ROOT, OUT_MD));
console.log("Pages sans couverture :", missing.length);
