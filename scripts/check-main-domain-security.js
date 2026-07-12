const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const checks = [
  {
    label: "Page publique racine",
    file: "src/app/page.tsx",
    mustInclude: ["Mpangi-church", "Plateforme multi-églises"],
  },
  {
    label: "Page main-domain-required",
    file: "src/app/main-domain-required/page.tsx",
    mustInclude: ["Utilisez le domaine privé"],
  },
  {
    label: "Middleware sécurité",
    file: "src/middleware.ts",
    mustInclude: [
      "isPrimaryDomain",
      "PRIVATE_CHURCH_PREFIXES",
      "tenant_domain_required",
      "main-domain-required",
    ],
  },
];

let failed = false;

console.log("");
console.log("Mpangi-church — vérification sécurité domaine principal");
console.log("");

for (const check of checks) {
  const fullPath = path.join(ROOT, check.file);

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log(`❌ ${check.label} : fichier manquant (${check.file})`);
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const missing = check.mustInclude.filter((token) => !content.includes(token));

  if (missing.length) {
    failed = true;
    console.log(`❌ ${check.label} : éléments manquants ${missing.join(", ")}`);
  } else {
    console.log(`✅ ${check.label}`);
  }
}

console.log("");

if (failed) {
  console.log("Sécurité domaine principal incomplète.");
  process.exit(1);
}

console.log("Sécurité domaine principal OK.");
console.log("");
console.log("Tests production à faire :");
console.log("- https://mpangi-church.app/");
console.log("- https://mpangi-church.app/dashboard");
console.log("- https://mpangi-church.app/members");
console.log("- https://mdm.mpangi-church.app/dashboard");
