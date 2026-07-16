const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const checkerPath = path.join(
  ROOT,
  "scripts/check-phase35v.js"
);

if (!fs.existsSync(checkerPath)) {
  console.error("❌ scripts/check-phase35v.js introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(checkerPath, "utf8");

const oldMarker = '"Variables VAPID absentes"';
const newMarker = '"variables VAPID absentes"';

if (source.includes(newMarker)) {
  console.log("ℹ️ Checker Phase 35V déjà corrigé.");
  process.exit(0);
}

if (!source.includes(oldMarker)) {
  console.error(
    "❌ Marqueur attendu introuvable dans le checker."
  );
  process.exit(1);
}

source = source.replace(oldMarker, newMarker);

fs.writeFileSync(checkerPath, source, "utf8");

console.log("✅ Checker Phase 35V corrigé.");
