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

const oldDev = pkg.scripts.dev || "next dev";

pkg.scripts["dev:turbo"] = oldDev.includes("next dev") ? oldDev : "next dev";
pkg.scripts.dev = "next dev --webpack";
pkg.scripts["dev:clean"] = "node scripts/reset-next-dev-cache.js && next dev --webpack";
pkg.scripts["build:webpack"] = "next build --webpack";

const backupPath = `${packagePath}.disable-turbopack-dev.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(packagePath, backupPath);
}

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("package.json corrigé.");
console.log("");
console.log("Scripts disponibles :");
console.log("- npm run dev         => next dev --webpack");
console.log("- npm run dev:clean   => nettoyage cache + next dev --webpack");
console.log("- npm run dev:turbo   => ancien mode Turbopack si besoin");
console.log("- npm run build:webpack");
console.log("");
console.log("Backup :", path.relative(ROOT, backupPath));
