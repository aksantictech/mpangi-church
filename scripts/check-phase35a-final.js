const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(fullPath);

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      return [fullPath];
    }

    return [];
  });
}

const requiredFiles = [
  "src/lib/users/userRoles.ts",
  "src/lib/users/createUserAccount.ts",
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

console.log("");
console.log("Contrôle final Phase 35A");
console.log("");

for (const relativePath of requiredFiles) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log("❌", relativePath);
  } else {
    console.log("✅", relativePath);
  }
}

const allSourceFiles = walk(path.join(ROOT, "src"));

for (const filePath of allSourceFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(ROOT, filePath);

  if (
    source.includes("allowExistingInSameChurch") ||
    source.includes("allowExistingWithoutChurch")
  ) {
    failed = true;
    console.log("❌ Ancienne propriété utilisateur :", relativePath);
  }
}

const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (fs.existsSync(layoutPath)) {
  const layout = fs.readFileSync(layoutPath, "utf8");

  for (const token of [
    "TenantPwaBootstrap",
    "mobile-production-hardening.css",
  ]) {
    if (!layout.includes(token)) {
      failed = true;
      console.log("❌ layout.tsx ne contient pas :", token);
    }
  }
}

const publicPagePath = path.join(
  ROOT,
  "src",
  "app",
  "church",
  "[slug]",
  "page.tsx"
);

if (fs.existsSync(publicPagePath)) {
  const page = fs.readFileSync(publicPagePath, "utf8");

  const actionBarImport =
    /import\s+PublicMobileActionBar\s+from\s+["'][^"']+["']/.test(page);

  const actionBarRender = /<PublicMobileActionBar\b/.test(page);

  const bottomNavCount =
    (page.match(/<PublicMobileBottomNav\b/g) || []).length;

  if (actionBarImport || actionBarRender) {
    failed = true;
    console.log("❌ PublicMobileActionBar est encore réellement utilisé.");
  } else {
    console.log("✅ PublicMobileActionBar absent.");
  }

  if (bottomNavCount !== 1) {
    failed = true;
    console.log(
      `❌ Nombre de PublicMobileBottomNav : ${bottomNavCount}, attendu : 1`
    );
  } else {
    console.log("✅ Une seule barre mobile publique.");
  }

  if (!page.includes("<PublicMobileBottomNav slug={churchSlug} />")) {
    failed = true;
    console.log("❌ PublicMobileBottomNav n’utilise pas churchSlug.");
  }
}

console.log("");

if (failed) {
  console.log("Phase 35A incomplète.");
  process.exit(1);
}

console.log("✅ Phase 35A validée.");
