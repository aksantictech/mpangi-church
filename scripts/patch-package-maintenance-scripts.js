const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const packagePath = path.join(ROOT, "package.json");

if (!fs.existsSync(packagePath)) {
  console.error("package.json introuvable.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

pkg.scripts = pkg.scripts || {};

const scriptsToAdd = {
  "audit:pages": "node scripts/audit-page-stability.js",
  "audit:mobile": "node scripts/audit-mobile-tables.js",
  "audit:states": "node scripts/audit-route-states.js",
  "cleanup:scan": "node scripts/cleanup-generated-backups.js",
  "cleanup:apply": "node scripts/cleanup-generated-backups.js --apply",
  "predeploy:check": "node scripts/predeploy-check.js",
  "predeploy:build": "node scripts/predeploy-check.js --build",
};

let changed = false;

for (const [key, value] of Object.entries(scriptsToAdd)) {
  if (pkg.scripts[key] !== value) {
    pkg.scripts[key] = value;
    changed = true;
  }
}

if (!changed) {
  console.log("package.json déjà configuré.");
  process.exit(0);
}

const backupPath = `${packagePath}.phase31.bak`;
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(packagePath, backupPath);
}

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("Scripts maintenance ajoutés dans package.json.");
console.log("Backup :", path.relative(ROOT, backupPath));
