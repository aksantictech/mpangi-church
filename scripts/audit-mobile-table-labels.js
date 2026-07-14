const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const reportPath = path.join(
  ROOT,
  "MOBILE_TABLES_ROUTES_REPORT.md"
);

function walk(directory) {
  const files = [];

  if (!fs.existsSync(directory)) return files;

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (
      entry.name === "page.tsx" ||
      entry.name === "page.jsx"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

const rows = [];

for (const filePath of walk(APP)) {
  const source = fs.readFileSync(filePath, "utf8");
  const tableCount = (source.match(/<table\b/g) || []).length;
  const headerCount = (source.match(/<th\b/g) || []).length;
  const formCount = (source.match(/<form\b/g) || []).length;

  if (tableCount > 0) {
    rows.push({
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      tableCount,
      headerCount,
      formCount,
      mode:
        headerCount > 0
          ? "Cartes mobiles possibles"
          : "Scroll horizontal conservé",
    });
  }
}

rows.sort(
  (a, b) =>
    b.tableCount - a.tableCount ||
    b.headerCount - a.headerCount
);

const lines = [
  "# Rapport routes avec tableaux",
  "",
  `Pages contenant des tableaux : ${rows.length}`,
  "",
  "| Page | Tables | En-têtes | Formulaires | Mode mobile |",
  "|---|---:|---:|---:|---|",
];

for (const row of rows) {
  lines.push(
    `| ${row.file} | ${row.tableCount} | ${row.headerCount} | ${row.formCount} | ${row.mode} |`
  );
}

fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

console.log("Audit tableaux terminé.");
console.log("Rapport :", path.basename(reportPath));
console.log("Pages :", rows.length);
