const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const forbidden = [
  "payload",
  ".phase35t-backup",
];

let failed = false;

for (const relativePath of forbidden) {
  const fullPath = path.join(ROOT, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log(`❌ Encore présent : ${relativePath}`);
    failed = true;
  } else {
    console.log(`✅ Absent du projet : ${relativePath}`);
  }
}

const financePage = path.join(
  ROOT,
  "src/app/finance/donations/page.tsx"
);

if (fs.existsSync(financePage)) {
  console.log(
    "✅ Page installée : src/app/finance/donations/page.tsx"
  );
} else {
  console.log(
    "❌ Page installée introuvable : src/app/finance/donations/page.tsx"
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log(
  "✅ Artifacts d’installation Phase 35T nettoyés."
);
