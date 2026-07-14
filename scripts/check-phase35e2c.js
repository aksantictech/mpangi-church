const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/lib/security/sensitiveGuards.ts",
  "src/components/security/PermissionNavigationDomFilter.tsx",
  "scripts/fix-phase35e2c-sensitive-routes.js",
  "scripts/audit-phase35e2c-after.js",
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
  const source = fs.readFileSync(layoutPath, "utf8");

  const imported = source.includes(
    "@/components/security/PermissionNavigationDomFilter"
  );

  const mounted = source.includes(
    "<PermissionNavigationDomFilter />"
  );

  console.log(
    imported ? "✅" : "❌",
    "Import PermissionNavigationDomFilter"
  );
  console.log(
    mounted ? "✅" : "❌",
    "Montage PermissionNavigationDomFilter"
  );

  if (!imported || !mounted) failed = true;
}

const superAdminRoute = path.join(
  ROOT,
  "src/app/api/super-admin/route.ts"
);

if (fs.existsSync(superAdminRoute)) {
  const source = fs.readFileSync(
    superAdminRoute,
    "utf8"
  );

  const ok = source.includes(
    "requireSuperAdminAccess"
  );

  console.log(
    ok ? "✅" : "❌",
    "Garde Super Admin"
  );

  if (!ok) failed = true;
}

const broadcastRoute = path.join(
  ROOT,
  "src/app/api/notifications/broadcast/route.ts"
);

if (fs.existsSync(broadcastRoute)) {
  const source = fs.readFileSync(
    broadcastRoute,
    "utf8"
  );

  const ok =
    source.includes("requireAnyActionPermission") ||
    source.includes("requireAnyModulePermission");

  console.log(
    ok ? "✅" : "❌",
    "Garde broadcast notifications"
  );

  if (!ok) failed = true;
}

if (failed) {
  console.log("");
  console.log("Phase 35E-2C incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35E-2C validée.");
