const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const checks = [
  ["src/proxy.ts", "resolveTenantSlug"],
  ["src/lib/tenant/domain.ts", "buildChurchPublicUrl"],
  ["src/components/layout/SuperAdminShell.tsx", "data-mpangi-superadmin-mobile-nav"],
  ["src/components/layout/MobileBottomNav.tsx", "mpangi:open-mobile-menu"],
  ["src/components/public/PublicMobileBottomNav.tsx", "data-mpangi-public-bottom-nav"],
  ["src/components/modules/ModuleLauncherClient.tsx", "data-mpangi-module-grid"],
  ["src/app/super-admin/apps/page.tsx", "Applications Super Admin"],
  ["src/app/api/bible/chapter/route.ts", "fums-version"],
  ["src/styles/production-stabilization.css", "grid-template-columns: repeat(5"],
  ["src/app/layout.tsx", "production-stabilization.css"],
];

let failed = false;

for (const [relativePath, marker] of checks) {
  const filePath = path.join(ROOT, relativePath);
  const exists = fs.existsSync(filePath);
  const source = exists
    ? fs.readFileSync(filePath, "utf8")
    : "";
  const ok = exists && source.includes(marker);

  console.log(ok ? "✅" : "❌", relativePath);

  if (!ok) failed = true;
}

const rootLayout = path.join(ROOT, "src/app/layout.tsx");
if (fs.existsSync(rootLayout)) {
  const source = fs.readFileSync(rootLayout, "utf8");
  const unstableMounted = source.includes(
    "<PermissionNavigationDomFilter"
  );

  console.log(
    unstableMounted ? "❌" : "✅",
    "Filtre DOM global désactivé"
  );

  if (unstableMounted) failed = true;
}

const bibleRoute = path.join(
  ROOT,
  "src/app/api/bible/chapter/route.ts"
);
if (fs.existsSync(bibleRoute)) {
  const source = fs.readFileSync(bibleRoute, "utf8");
  const hasInvalidParam = source.includes('"use-org-id"');

  console.log(
    hasInvalidParam ? "❌" : "✅",
    "Paramètre Bible non documenté supprimé"
  );

  if (hasInvalidParam) failed = true;
}

if (failed) {
  console.log("");
  console.log("Phase 35S incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35S structurellement validée.");
