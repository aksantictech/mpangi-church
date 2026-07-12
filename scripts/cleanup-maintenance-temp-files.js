const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

const candidates = [
  "manual_github_upload",
  "manual_github_upload_FILES_LIST.txt",
  "page-stability-report.json",
];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      walk(fullPath, results);
    } else {
      if (
        entry.name.endsWith(".bak") ||
        entry.name.endsWith(".tmp") ||
        entry.name.endsWith(".old")
      ) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

const found = [
  ...candidates.map((candidate) => path.join(ROOT, candidate)).filter(fs.existsSync),
  ...walk(ROOT),
];

console.log("");
console.log("Fichiers temporaires détectés :");
for (const item of found) {
  console.log("-", path.relative(ROOT, item));
}

if (!found.length) {
  console.log("Aucun fichier temporaire détecté.");
  process.exit(0);
}

if (!APPLY) {
  console.log("");
  console.log("Mode lecture seule. Pour supprimer :");
  console.log("node scripts/cleanup-maintenance-temp-files.js --apply");
  process.exit(0);
}

for (const item of found) {
  const stat = fs.statSync(item);
  if (stat.isDirectory()) fs.rmSync(item, { recursive: true, force: true });
  else fs.rmSync(item, { force: true });
}

console.log("");
console.log("Nettoyage terminé.");
