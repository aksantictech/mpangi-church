const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const files = [
  "src/app/api/pwa/icon/[size]/route.ts",
  "src/app/api/pwa/manifest/route.ts",
];

let failed = false;

for (const file of files) {
  const fullPath = path.join(ROOT, file);

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log("❌ Fichier absent :", file);
    continue;
  }

  const source = fs.readFileSync(fullPath, "utf8");

  if (!source.includes("async () =>")) {
    failed = true;
    console.log("❌ Requêtes PWA non corrigées :", file);
  } else {
    console.log("✅", file);
  }
}

if (failed) process.exit(1);

console.log("");
console.log("Hotfix PWA TypeScript OK.");
