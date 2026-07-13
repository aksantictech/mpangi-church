const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const requiredFiles = [
  "src/app/super-admin/users/new/page.tsx",
  "src/app/super-admin/users/new/actions.ts",
  "src/app/super-admin/users/news/page.tsx",
  "src/app/super-admin/settings/users/new/page.tsx",
  "src/app/super-admin/settings/users/news/page.tsx",
];

let failed = false;

console.log("");
console.log("Vérification routes création utilisateur Super Admin");
console.log("");

for (const relativePath of requiredFiles) {
  const fullPath = path.join(ROOT, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    failed = true;
    console.log("❌", relativePath);
  }
}

if (failed) {
  console.log("");
  console.log("Routes incomplètes.");
  process.exit(1);
}

console.log("");
console.log("Routes utilisateur OK.");
console.log("Tester : http://localhost:3000/super-admin/users/new");
