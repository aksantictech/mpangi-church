const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const registryPath = path.join(ROOT, "src", "lib", "modules", "moduleRegistry.ts");

if (!fs.existsSync(registryPath)) {
  console.log("moduleRegistry.ts introuvable. La route /dashboard/role reste accessible directement.");
  process.exit(0);
}

let source = fs.readFileSync(registryPath, "utf8");
const original = source;

if (source.includes('href: "/dashboard/role"')) {
  console.log("Lien dashboard rôle déjà présent.");
  process.exit(0);
}

const marker = `{
    code: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    category: "system",
    alwaysVisible: true,
  },`;

const insert = `${marker}
  {
    code: "dashboard",
    label: "Dashboard rôle",
    href: "/dashboard/role",
    icon: LayoutDashboard,
    category: "system",
    alwaysVisible: true,
  },`;

if (!source.includes(marker)) {
  console.log("Structure moduleRegistry non reconnue. La route /dashboard/role reste disponible.");
  process.exit(0);
}

source = source.replace(marker, insert);

const backupPath = `${registryPath}.phase33-role-dashboard.bak`;
if (!fs.existsSync(backupPath)) fs.copyFileSync(registryPath, backupPath);
fs.writeFileSync(registryPath, source, "utf8");

console.log("Lien Dashboard rôle ajouté au menu.");
console.log("Backup :", path.relative(ROOT, backupPath));
