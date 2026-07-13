const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "church", "[slug]", "layout.tsx");
const pagePath = path.join(ROOT, "src", "app", "church", "[slug]", "page.tsx");

console.log("");
console.log("Recherche du point d'intégration public...");
console.log("");

if (fs.existsSync(layoutPath)) {
  console.log("Layout public trouvé : src/app/church/[slug]/layout.tsx");
  console.log("Ajoute PublicMobileBottomNav dans ce fichier.");
  process.exit(0);
}

if (fs.existsSync(pagePath)) {
  console.log("Aucun layout public dédié.");
  console.log("Page publique trouvée : src/app/church/[slug]/page.tsx");
  console.log("Ajoute PublicMobileBottomNav juste avant la fermeture du conteneur principal.");
  process.exit(0);
}

console.log("Ni layout ni page publique trouvés.");
process.exit(1);
