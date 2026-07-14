const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");

const imageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) return walk(fullPath);

      return [fullPath];
    });
}

const rows = walk(PUBLIC).map((filePath) => {
  const stat = fs.statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();

  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    bytes: stat.size,
    megabytes: Number((stat.size / 1024 / 1024).toFixed(3)),
    image: imageExtensions.has(extension),
    extension,
    warning:
      stat.size > 2 * 1024 * 1024
        ? "CRITICAL"
        : stat.size > 500 * 1024
          ? "LARGE"
          : "OK",
  };
});

rows.sort((a, b) => b.bytes - a.bytes);

fs.writeFileSync(
  path.join(ROOT, "public-assets-report.json"),
  JSON.stringify(rows, null, 2),
  "utf8"
);

const markdown = [
  "# Rapport des ressources publiques",
  "",
  `Fichiers : ${rows.length}`,
  "",
  "| Fichier | Taille Mo | Type | Statut |",
  "|---|---:|---|---|",
  ...rows.slice(0, 100).map(
    (row) =>
      `| ${row.file} | ${row.megabytes} | ${row.extension || "-"} | ${row.warning} |`
  ),
  "",
  "## Seuils",
  "",
  "- `OK` : inférieur ou égal à 500 Ko",
  "- `LARGE` : supérieur à 500 Ko",
  "- `CRITICAL` : supérieur à 2 Mo",
];

fs.writeFileSync(
  path.join(ROOT, "PUBLIC_ASSETS_REPORT.md"),
  markdown.join("\n"),
  "utf8"
);

console.log("Audit ressources publiques terminé.");
console.log("Rapport : PUBLIC_ASSETS_REPORT.md");
