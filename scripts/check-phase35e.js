const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "phase35e_roles_permissions_dashboards.sql",
  "src/lib/security/roleCatalog.ts",
  "src/lib/security/permissionEngine.ts",
  "src/lib/dashboard/roleDashboard.ts",
  "src/app/api/security/my-capabilities/route.ts",
  "src/app/dashboard/role/page.tsx",
  "src/app/my-work/actions.ts",
  "src/app/my-work/page.tsx",
  "src/app/settings/roles/actions.ts",
  "src/app/settings/roles/page.tsx",
  "src/components/security/RoleQuickLinks.tsx",
  "scripts/audit-phase35e-security.js",
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

if (failed) {
  console.log("");
  console.log("Phase 35E-1 incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35E-1 validée.");
