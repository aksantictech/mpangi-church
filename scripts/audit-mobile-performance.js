const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name.endsWith(".bak")
      ) {
        return [];
      }

      if (entry.isDirectory()) return walk(fullPath);

      if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
        return [fullPath];
      }

      return [];
    });
}

const rows = walk(SRC).map((filePath) => {
  const stat = fs.statSync(filePath);
  const source = fs.readFileSync(filePath, "utf8");

  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    bytes: stat.size,
    lines: source.split(/\r?\n/).length,
    useClient: /^\s*["']use client["'];/m.test(source),
    images: (source.match(/<Image\b|<img\b/g) || []).length,
    iframes: (source.match(/<iframe\b/g) || []).length,
    fixed: (source.match(/\bfixed\b/g) || []).length,
    animations:
      (source.match(/animate-|@keyframes|animation:/g) || []).length,
  };
});

rows.sort((a, b) => b.bytes - a.bytes);

const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: rows.length,
  totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
  largestFiles: rows.slice(0, 50),
  clientFiles: rows
    .filter((row) => row.useClient)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 50),
  imageHeavyFiles: rows
    .filter((row) => row.images > 0 || row.iframes > 0)
    .sort(
      (a, b) =>
        b.images + b.iframes - (a.images + a.iframes)
    )
    .slice(0, 50),
};

fs.writeFileSync(
  path.join(ROOT, "mobile-performance-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

const markdown = [
  "# Rapport performance mobile",
  "",
  `Fichiers analysés : ${report.totalFiles}`,
  `Poids total source : ${report.totalBytes} octets`,
  "",
  "## 30 fichiers les plus volumineux",
  "",
  "| Fichier | Taille | Lignes | Client | Images | Iframes | Animations |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...report.largestFiles.slice(0, 30).map(
    (row) =>
      `| ${row.file} | ${row.bytes} | ${row.lines} | ${row.useClient ? "oui" : "non"} | ${row.images} | ${row.iframes} | ${row.animations} |`
  ),
  "",
  "## Recommandations",
  "",
  "- Examiner en priorité les fichiers client très volumineux.",
  "- Fractionner les composants dépassant environ 500 lignes.",
  "- Charger les iframes et médias uniquement lorsque nécessaires.",
  "- Conserver les images publiques sous 500 Ko lorsque possible.",
  "- Éviter plusieurs enhancers globaux redondants à terme.",
];

fs.writeFileSync(
  path.join(ROOT, "MOBILE_PERFORMANCE_REPORT.md"),
  markdown.join("\n"),
  "utf8"
);

console.log("Audit performance mobile terminé.");
console.log("Rapport : MOBILE_PERFORMANCE_REPORT.md");
console.log("JSON    : mobile-performance-report.json");
