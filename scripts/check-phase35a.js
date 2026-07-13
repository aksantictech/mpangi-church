const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

const requiredFiles = [
  "src/app/settings/users/new/actions.ts",
  "src/app/super-admin/users/new/actions.ts",
  "src/components/pwa/TenantPwaBootstrap.tsx",
  "src/components/pwa/UniversalInstallButton.tsx",
  "src/app/api/pwa/manifest/route.ts",
  "src/app/api/pwa/icon/[size]/route.ts",
  "src/app/install/page.tsx",
  "src/components/layout/MobileBottomNav.tsx",
  "src/components/public/PublicMobileBottomNav.tsx",
  "src/styles/mobile-production-hardening.css",
];

let failed = false;
console.log("\nMpangi-church — contrôle Phase 35A\n");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    failed = true;
    console.log("❌", file);
  } else {
    console.log("✅", file);
  }
}

const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
if (fs.existsSync(layoutPath)) {
  const layout = fs.readFileSync(layoutPath, "utf8");
  for (const token of ["TenantPwaBootstrap", "mobile-production-hardening.css"]) {
    if (!layout.includes(token)) {
      failed = true;
      console.log("❌ layout.tsx ne contient pas :", token);
    }
  }
}

console.log("");
if (failed) {
  console.log("Phase 35A incomplète.");
  process.exit(1);
}
console.log("Phase 35A OK.");
console.log("Tests : /settings/users/new, /super-admin/users/new, /install, /api/pwa/manifest");
