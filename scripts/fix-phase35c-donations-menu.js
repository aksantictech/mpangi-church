const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const registryPath = path.join(
  ROOT,
  "src",
  "lib",
  "modules",
  "moduleRegistry.ts"
);

if (!fs.existsSync(registryPath)) {
  console.error("❌ Fichier introuvable :", registryPath);
  process.exit(1);
}

let source = fs.readFileSync(registryPath, "utf8");
const original = source;
const backupPath = `${registryPath}.phase35c-menu-hotfix.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(registryPath, backupPath);
  console.log("✅ Backup créé :", path.relative(ROOT, backupPath));
}

// 1) Ajouter HandCoins dans l'import lucide-react.
const lucideImportRegex =
  /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];/m;

const lucideMatch = source.match(lucideImportRegex);

if (!lucideMatch) {
  console.error("❌ Import lucide-react non reconnu.");
  process.exit(1);
}

const importedIcons = lucideMatch[1]
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!importedIcons.includes("HandCoins")) {
  importedIcons.push("HandCoins");
  importedIcons.sort((a, b) => a.localeCompare(b));

  const rebuiltImport =
    "import {\n" +
    importedIcons.map((icon) => `  ${icon},`).join("\n") +
    '\n} from "lucide-react";';

  source = source.replace(lucideImportRegex, rebuiltImport);
  console.log("✅ Icône HandCoins ajoutée.");
} else {
  console.log("ℹ️ Icône HandCoins déjà présente.");
}

// 2) Supprimer un éventuel ancien bloc incomplet/dupliqué ayant ce href.
source = source.replace(
  /\s*\{\s*code:\s*["'][^"']+["'],\s*label:\s*["']Dons reçus["'],\s*href:\s*["']\/finance\/donations["'],[\s\S]*?category:\s*["']finance["'],\s*\},?/g,
  ""
);

// 3) Ajouter le bloc avant "Entrées / offrandes".
const donationMenuBlock = `
  {
    code: "offerings",
    label: "Dons reçus",
    href: "/finance/donations",
    icon: HandCoins,
    category: "finance",
  },
`;

const offeringsMarker =
  /\n\s*\{\s*\n\s*code:\s*["']offerings["'],\s*\n\s*label:\s*["']Entrées\s*\/\s*offrandes["'],/m;

if (offeringsMarker.test(source)) {
  source = source.replace(
    offeringsMarker,
    `${donationMenuBlock}$&`
  );
  console.log("✅ Menu Dons reçus ajouté avant Entrées / offrandes.");
} else {
  // Fallback : insérer avant le premier item finance reconnu.
  const financeMarker =
    /\n\s*\{\s*\n\s*code:\s*["']finance_dashboard["'],/m;

  if (financeMarker.test(source)) {
    source = source.replace(
      financeMarker,
      `${donationMenuBlock}$&`
    );
    console.log("✅ Menu Dons reçus ajouté dans le volet finances.");
  } else {
    console.error(
      "❌ Aucun point d'insertion finance reconnu dans moduleRegistry.ts."
    );
    process.exit(1);
  }
}

// Nettoyage léger.
source = source.replace(/\n{4,}/g, "\n\n\n");

fs.writeFileSync(registryPath, source, "utf8");

// 4) Contrôle final.
const finalSource = fs.readFileSync(registryPath, "utf8");

const checks = {
  handCoinsImport:
    /import\s*\{[\s\S]*?\bHandCoins\b[\s\S]*?\}\s*from\s*["']lucide-react["'];/m.test(
      finalSource
    ),
  donationsHref:
    /href:\s*["']\/finance\/donations["']/.test(finalSource),
  donationsLabel:
    /label:\s*["']Dons reçus["']/.test(finalSource),
  donationsIcon:
    /href:\s*["']\/finance\/donations["'][\s\S]{0,180}icon:\s*HandCoins/.test(
      finalSource
    ),
  financeCategory:
    /href:\s*["']\/finance\/donations["'][\s\S]{0,220}category:\s*["']finance["']/.test(
      finalSource
    ),
};

console.log("");
console.log("Contrôle moduleRegistry.ts :");

for (const [name, ok] of Object.entries(checks)) {
  console.log(ok ? "✅" : "❌", name);
}

if (Object.values(checks).some((value) => !value)) {
  console.error("");
  console.error("❌ Le menu Dons n'est pas complètement stabilisé.");
  process.exit(1);
}

if (source === original) {
  console.log("");
  console.log("ℹ️ Aucun changement nécessaire.");
} else {
  console.log("");
  console.log("✅ moduleRegistry.ts corrigé avec succès.");
}
