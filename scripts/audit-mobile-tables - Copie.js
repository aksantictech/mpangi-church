const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");
const OUT_MD = path.join(ROOT, "MOBILE_TABLES_AUDIT_REPORT.md");

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
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
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

const rows = walk(APP_DIR)
  .map((filePath) => {
    const source = read(filePath);
    const tableCount = (source.match(/<table\b/g) || []).length;
    const hasManualMobile =
      source.includes("MobileRecordCard") ||
      source.includes("ResponsiveDataSection") ||
      source.includes("md:hidden");

    return {
      route: routeForFile(filePath),
      file: path.relative(ROOT, filePath).replaceAll("\\", "/"),
      tableCount,
      hasManualMobile,
      status:
        tableCount === 0
          ? "no_table"
          : hasManualMobile
            ? "manual_mobile"
            : "auto_cards",
    };
  })
  .filter((row) => row.tableCount > 0)
  .sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.route.localeCompare(b.route);
  });

const autoCards = rows.filter((row) => row.status === "auto_cards");
const manual = rows.filter((row) => row.status === "manual_mobile");

const md = [
  "# Mpangi-church — Audit tables mobiles",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "## Résumé",
  "",
  `- Pages avec tableaux : ${rows.length}`,
  `- Pages couvertes par cartes automatiques globales : ${autoCards.length}`,
  `- Pages ayant déjà une logique mobile manuelle : ${manual.length}`,
  "",
  "## Pages couvertes par les cartes automatiques",
  "",
  autoCards.length === 0
    ? "Aucune page."
    : [
        "| Route | Tables | Fichier |",
        "|---|---:|---|",
        ...autoCards.map(
          (row) => `| \`${row.route}\` | ${row.tableCount} | \`${row.file}\` |`
        ),
      ].join("\n"),
  "",
  "## Pages avec mobile manuel déjà détecté",
  "",
  manual.length === 0
    ? "Aucune page."
    : [
        "| Route | Tables | Fichier |",
        "|---|---:|---|",
        ...manual.map(
          (row) => `| \`${row.route}\` | ${row.tableCount} | \`${row.file}\` |`
        ),
      ].join("\n"),
  "",
  "## Note",
  "",
  "Cette phase ajoute une transformation mobile globale. Elle améliore rapidement toutes les tables sans modifier la logique des pages.",
  "La prochaine phase pourra remplacer progressivement certaines pages par des cartes React sur mesure.",
  "",
].join("\n");

fs.writeFileSync(OUT_MD, md, "utf8");

console.log("");
console.log("Audit tables mobiles terminé.");
console.log("Rapport :", path.relative(ROOT, OUT_MD));
console.log("");
console.log(`Pages avec tableaux : ${rows.length}`);
console.log(`Cartes automatiques : ${autoCards.length}`);
console.log(`Mobile manuel      : ${manual.length}`);
