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

pkg.scripts.dev = "next dev --webpack -p 3000";
pkg.scripts["dev:3000"] = "next dev --webpack -p 3000";
pkg.scripts["dev:clean"] = "node scripts/reset-next-dev-cache.js && next dev --webpack -p 3000";
pkg.scripts["dev:hard"] = "powershell -ExecutionPolicy Bypass -File scripts/reset-next-local-hard.ps1 && next dev --webpack -p 3000";

const backupPath = `${packagePath}.dev-port-3000.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(packagePath, backupPath);
}

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("Scripts dev stabilisés sur port 3000.");
console.log("");
console.log("Utilise maintenant :");
console.log("- npm run dev:hard");
console.log("- ou npm run dev:3000");
console.log("");
console.log("Backup :", path.relative(ROOT, backupPath));
