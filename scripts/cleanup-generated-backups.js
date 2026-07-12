const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

const PROTECTED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  "dist",
  "build",
]);

const TEMP_FILE_PATTERNS = [
  /\.bak$/i,
  /\.tmp$/i,
  /\.old$/i,
  /\.phase\d+.*\.bak$/i,
  /\.background\.bak$/i,
  /\.extensions-style\.bak$/i,
  /\.modules-menu\.bak$/i,
  /\.pwa-provider\.bak$/i,
  /\.supabase-client\.bak$/i,
];

const GENERATED_REPORTS = new Set([
  "page-stability-report.json",
  "PAGE_BACKGROUND_PATCH_REPORT.md",
  "EXTENSIONS_STYLE_PATCH_REPORT.md",
  "PHASE28_CRITICAL_PAGES_REPORT.md",
  "MOBILE_TABLES_AUDIT_REPORT.md",
  "ROUTE_STATES_COVERAGE_REPORT.md",
]);

const GENERATED_DIRS = new Set([
  "manual_github_upload",
]);

function shouldSkipDir(name) {
  return PROTECTED_DIRS.has(name);
}

function isTempFile(filePath) {
  const name = path.basename(filePath);

  if (GENERATED_REPORTS.has(name)) return true;

  return TEMP_FILE_PATTERNS.some((pattern) => pattern.test(name));
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;

      if (GENERATED_DIRS.has(entry.name)) {
        results.push(fullPath);
        continue;
      }

      walk(fullPath, results);
    } else if (isTempFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

const targets = walk(ROOT).sort();

console.log("");
console.log("Mpangi-church — nettoyage fichiers temporaires");
console.log("Mode :", APPLY ? "SUPPRESSION" : "LECTURE SEULE");
console.log("");

if (!targets.length) {
  console.log("Aucun fichier temporaire détecté.");
  process.exit(0);
}

for (const item of targets) {
  console.log("-", path.relative(ROOT, item));
}

console.log("");
console.log(`Total : ${targets.length}`);

if (!APPLY) {
  console.log("");
  console.log("Aucune suppression effectuée.");
  console.log("Pour supprimer réellement :");
  console.log("node scripts/cleanup-generated-backups.js --apply");
  process.exit(0);
}

for (const item of targets) {
  const stat = fs.statSync(item);

  if (stat.isDirectory()) {
    fs.rmSync(item, { recursive: true, force: true });
  } else {
    fs.rmSync(item, { force: true });
  }
}

console.log("");
console.log("Nettoyage terminé.");
