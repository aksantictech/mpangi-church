const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/lib/users/createUserAccount.ts",
  "src/lib/users/userRoles.ts",
  "src/app/settings/users/new/page.tsx",
  "src/app/settings/users/new/actions.ts",
  "src/app/super-admin/users/new/page.tsx",
  "src/app/super-admin/users/new/actions.ts",
  "src/app/settings/users/news/page.tsx",
  "src/app/super-admin/users/news/page.tsx",
];

let failed = false;

console.log("");
console.log("Vérification utilisateurs/rôles/logo");
console.log("");

for (const file of required) {
  if (fs.existsSync(path.join(ROOT, file))) {
    console.log("✅", file);
  } else {
    failed = true;
    console.log("❌", file);
  }
}

const logo = path.join(ROOT, "public", "images", "mpangi-logo.png");
const icon = path.join(ROOT, "public", "icons", "icon-192.png");

if (fs.existsSync(logo)) {
  console.log("✅ public/images/mpangi-logo.png");
} else {
  console.log("⚠️ public/images/mpangi-logo.png absent");
}

if (fs.existsSync(icon)) {
  console.log("✅ public/icons/icon-192.png");
} else {
  console.log("⚠️ public/icons/icon-192.png absent");
}

if (failed) process.exit(1);

console.log("");
console.log("OK.");
