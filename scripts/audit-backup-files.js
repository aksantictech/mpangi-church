const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  ".maintenance-backups",
]);

function walk(directory) {
  const rows = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (
      entry.isDirectory() &&
      ignoredDirectories.has(entry.name)
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      rows.push(...walk(fullPath));
      continue;
    }

    if (
      entry.name.endsWith(".bak") ||
      entry.name.includes(".before-") ||
      entry.name.includes(".phase35")
    ) {
      const stat = fs.statSync(fullPath);

      rows.push({
        file: path.relative(ROOT, fullPath).replace(/\\/g, "/"),
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }

  return rows;
}

const rows = walk(ROOT).sort((a, b) => b.bytes - a.bytes);

fs.writeFileSync(
  path.join(ROOT, "backup-files-report.json"),
  JSON.stringify(rows, null, 2),
  "utf8"
);

const total = rows.reduce((sum, row) => sum + row.bytes, 0);

const markdown = [
  "# Rapport des backups locaux",
  "",
  `Fichiers détectés : ${rows.length}`,
  `Poids total : ${(total / 1024 / 1024).toFixed(2)} Mo`,
  "",
  "| Fichier | Taille octets | Modifié |",
  "|---|---:|---|",
  ...rows.map(
    (row) =>
      `| ${row.file} | ${row.bytes} | ${row.modifiedAt} |`
  ),
  "",
  "Aucun fichier n’est supprimé par cet audit.",
  "Utilisez `node scripts/archive-backups.js --apply` uniquement après validation.",
];

fs.writeFileSync(
  path.join(ROOT, "BACKUP_FILES_REPORT.md"),
  markdown.join("\n"),
  "utf8"
);

console.log("Audit backups terminé.");
console.log("Fichiers détectés :", rows.length);
console.log("Rapport : BACKUP_FILES_REPORT.md");
