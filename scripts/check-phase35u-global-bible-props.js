const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src/app/bible/page.tsx"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ src/app/bible/page.tsx introuvable");
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf8");

const checks = [
  {
    label: "BibleReaderClient présent",
    ok: source.includes("BibleReaderClient"),
  },
  {
    label: "churchSlug fourni",
    ok: source.includes('churchSlug="mpangi-church"'),
  },
  {
    label: "churchName fourni",
    ok: source.includes('churchName="Mpangi-Church"'),
  },
];

let failed = false;

for (const check of checks) {
  console.log(
    check.ok ? "✅" : "❌",
    check.label
  );

  if (!check.ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log("✅ Contrat Bible globale corrigé.");
