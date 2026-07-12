const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const shellPath = path.join(ROOT, "src", "components", "layout", "SuperAdminShell.tsx");

if (!fs.existsSync(shellPath)) {
  console.log("SuperAdminShell introuvable. La route /super-admin/onboarding reste accessible directement.");
  process.exit(0);
}

let source = fs.readFileSync(shellPath, "utf8");
const original = source;

if (source.includes("/super-admin/onboarding")) {
  console.log("Lien onboarding déjà présent.");
  process.exit(0);
}

if (!source.includes("Rocket")) {
  source = source.replace(
    'Boxes,',
    'Boxes,\n  Rocket,'
  );
}

const marker = `{
    label: "Modules",
    href: "/super-admin/modules",
    icon: Boxes,
  },`;

const insert = `${marker}
  {
    label: "Onboarding",
    href: "/super-admin/onboarding",
    icon: Rocket,
  },`;

if (source.includes(marker)) {
  source = source.replace(marker, insert);
} else {
  console.log("Structure menu non reconnue. Ajoute manuellement /super-admin/onboarding dans SuperAdminShell.");
  process.exit(0);
}

const backupPath = `${shellPath}.phase32-onboarding.bak`;
if (!fs.existsSync(backupPath)) fs.copyFileSync(shellPath, backupPath);
fs.writeFileSync(shellPath, source, "utf8");

console.log("Lien Onboarding ajouté au menu super admin.");
console.log("Backup :", path.relative(ROOT, backupPath));
