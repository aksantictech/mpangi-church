const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/styles/mobile-hardening.css",
  "src/components/mobile/MobilePageShell.tsx",
  "src/components/mobile/MobileHero.tsx",
  "src/components/mobile/MobileSection.tsx",
  "src/components/mobile/MobileDataCards.tsx",
  "scripts/audit-mobile-pages-v2.js",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(ROOT, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    failed = true;
    console.log("❌", relativePath);
  }
}

const layoutPath = path.join(ROOT, "src/app/layout.tsx");

if (!fs.existsSync(layoutPath)) {
  failed = true;
  console.log("❌ src/app/layout.tsx");
} else {
  const layout = fs.readFileSync(layoutPath, "utf8");

  if (layout.includes("@/styles/mobile-hardening.css")) {
    console.log("✅ Import mobile-hardening.css");
  } else {
    failed = true;
    console.log("❌ Import mobile-hardening.css absent");
  }
}

const mobileNavPath = path.join(
  ROOT,
  "src/components/layout/MobileBottomNav.tsx"
);

if (fs.existsSync(mobileNavPath)) {
  const mobileNav = fs.readFileSync(mobileNavPath, "utf8");

  if (
    mobileNav.includes('href: "/mobile-menu"') ||
    mobileNav.includes('href="/mobile-menu"')
  ) {
    failed = true;
    console.log("❌ Lien cassé /mobile-menu encore présent");
  } else {
    console.log("✅ Aucun lien cassé /mobile-menu");
  }
}

console.log("");

if (failed) {
  console.log("Phase 35D incomplète.");
  process.exit(1);
}

console.log("✅ Phase 35D — socle mobile validée.");
