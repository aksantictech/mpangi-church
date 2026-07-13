const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const targets = [
  ".next",
  path.join("node_modules", ".cache"),
];

for (const target of targets) {
  const fullPath = path.join(ROOT, target);

  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log("Supprimé :", target);
  } else {
    console.log("Déjà absent :", target);
  }
}

console.log("Cache dev nettoyé.");
