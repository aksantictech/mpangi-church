const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const checkerPath = path.join(
  ROOT,
  "scripts/check-phase35w.js"
);

if (!fs.existsSync(checkerPath)) {
  console.error("❌ scripts/check-phase35w.js introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(checkerPath, "utf8");

const oldMarker = '"Nouvelle publication"';
const reliableMarker = '"sendChurchNotification"';

if (source.includes(reliableMarker)) {
  console.log("ℹ️ Checker Phase 35W déjà corrigé.");
  process.exit(0);
}

if (!source.includes(oldMarker)) {
  console.error(
    "❌ Le marqueur Nouvelle publication est introuvable dans le checker."
  );
  process.exit(1);
}

source = source.replace(
  oldMarker,
  reliableMarker
);

fs.writeFileSync(
  checkerPath,
  source,
  "utf8"
);

console.log("✅ Checker Phase 35W corrigé.");
console.log(
  "   Le contrôle porte maintenant sur sendChurchNotification."
);
