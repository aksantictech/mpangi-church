const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const pagePath = path.join(ROOT, "src", "app", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("src/app/page.tsx introuvable.");
  process.exit(1);
}

const source = fs.readFileSync(pagePath, "utf8");
const forbidden = [
  "/super-admin",
  "Super Admin",
  "Super admin",
  "super-admin/dashboard",
];

const found = forbidden.filter((token) => source.includes(token));

if (found.length) {
  console.error("La page publique contient encore des références Super Admin :");
  for (const token of found) console.error("-", token);
  process.exit(1);
}

const required = [
  "getPublicChurches",
  "Plateforme intelligente",
  "Églises déjà présentes",
  "createAdminClient",
];

const missing = required.filter((token) => !source.includes(token));

if (missing.length) {
  console.error("La page publique semble incomplète. Éléments manquants :");
  for (const token of missing) console.error("-", token);
  process.exit(1);
}

console.log("Page publique OK : aucun lien Super Admin détecté.");
