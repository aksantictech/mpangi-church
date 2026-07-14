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

function backup(filePath) {
  const backupPath = `${filePath}.phase35c.bak`;

  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

if (!fs.existsSync(registryPath)) {
  console.log(
    "⚠️ moduleRegistry.ts introuvable. Ajoutez le lien Dons reçus manuellement."
  );
  process.exit(0);
}

let source = fs.readFileSync(registryPath, "utf8");
const original = source;

if (!source.includes("HandCoins")) {
  source = source.replace(
    /(\s+HeartHandshake,\s*\n)/,
    "$1  HandCoins,\n"
  );
}

if (!source.includes('href: "/finance/donations"')) {
  const marker = `  {
    code: "offerings",
    label: "Entrées / offrandes",`;

  const item = `  {
    code: "offerings",
    label: "Dons reçus",
    href: "/finance/donations",
    icon: HandCoins,
    category: "finance",
  },
`;

  if (source.includes(marker)) {
    source = source.replace(marker, item + marker);
  } else {
    console.log(
      "⚠️ Emplacement du menu finance non reconnu. Ajoutez Dons reçus manuellement."
    );
  }
}

if (source !== original) {
  backup(registryPath);
  fs.writeFileSync(registryPath, source, "utf8");
  console.log("✅ Menu Dons reçus ajouté au volet finances.");
} else {
  console.log("ℹ️ Menu Dons déjà présent ou aucune modification.");
}

console.log("✅ Phase 35C installée.");
