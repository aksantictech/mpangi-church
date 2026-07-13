const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const pagePath = path.join(ROOT, "src", "app", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("src/app/page.tsx introuvable.");
  process.exit(1);
}

const source = fs.readFileSync(pagePath, "utf8");

const required = [
  "https://www.aksantictech.com",
  "MPANGI_LOGO_SRC",
  "Églises déjà présentes",
  "Connexion",
];

const forbidden = [
  "/super-admin",
  "Super Admin",
  "super-admin/dashboard",
];

const missing = required.filter((token) => !source.includes(token));
const foundForbidden = forbidden.filter((token) => source.includes(token));

if (missing.length) {
  console.error("Éléments manquants :");
  for (const item of missing) console.error("-", item);
  process.exit(1);
}

if (foundForbidden.length) {
  console.error("Références Super Admin interdites détectées :");
  for (const item of foundForbidden) console.error("-", item);
  process.exit(1);
}

console.log("Page publique OK : logo, lien AKSANTIC et absence Super Admin validés.");
