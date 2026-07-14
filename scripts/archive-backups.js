const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const archiveRoot = path.join(
  ROOT,
  ".maintenance-backups",
  new Date().toISOString().replace(/[:.]/g, "-")
);

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
      rows.push(fullPath);
    }
  }

  return rows;
}

const files = walk(ROOT);

if (!APPLY) {
  console.log("Mode simulation. Aucun fichier déplacé.");
  console.log("Fichiers détectés :", files.length);
  console.log("");
  files.slice(0, 100).forEach((filePath) =>
    console.log("-", path.relative(ROOT, filePath))
  );
  console.log("");
  console.log(
    "Pour archiver réellement : node scripts/archive-backups.js --apply"
  );
  process.exit(0);
}

fs.mkdirSync(archiveRoot, { recursive: true });

for (const filePath of files) {
  const relativePath = path.relative(ROOT, filePath);
  const targetPath = path.join(archiveRoot, relativePath);

  fs.mkdirSync(path.dirname(targetPath), {
    recursive: true,
  });

  fs.renameSync(filePath, targetPath);
}

console.log("Backups archivés :", files.length);
console.log("Dossier :", path.relative(ROOT, archiveRoot));
