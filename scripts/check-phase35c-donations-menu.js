const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "src",
  "lib",
  "modules",
  "moduleRegistry.ts"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ moduleRegistry.ts introuvable.");
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf8");

const requirements = [
  {
    label: "Import HandCoins",
    ok: /import\s*\{[\s\S]*?\bHandCoins\b[\s\S]*?\}\s*from\s*["']lucide-react["'];/m.test(
      source
    ),
  },
  {
    label: "Lien /finance/donations",
    ok: /href:\s*["']\/finance\/donations["']/.test(source),
  },
  {
    label: "Libellé Dons reçus",
    ok: /label:\s*["']Dons reçus["']/.test(source),
  },
  {
    label: "Catégorie finance",
    ok: /href:\s*["']\/finance\/donations["'][\s\S]{0,220}category:\s*["']finance["']/.test(
      source
    ),
  },
];

let failed = false;

for (const item of requirements) {
  console.log(item.ok ? "✅" : "❌", item.label);
  if (!item.ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log("✅ Menu Dons reçus correctement installé.");
