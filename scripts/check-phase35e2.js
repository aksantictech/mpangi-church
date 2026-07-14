const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/lib/security/routePermissionMap.ts",
  "src/lib/security/routeGuard.ts",
  "src/lib/security/secureAction.ts",
  "src/lib/security/permissionNavigation.ts",
  "src/app/api/security/navigation/route.ts",
  "src/components/security/PermissionModuleGrid.tsx",
  "src/app/modules/page.tsx",
  "scripts/install-phase35e2.js",
  "scripts/audit-phase35e2-security.js",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(
    ROOT,
    relativePath
  );

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    failed = true;
    console.log("❌", relativePath);
  }
}

const middlewareCandidates = [
  "src/middleware.ts",
  "middleware.ts",
].filter((relativePath) =>
  fs.existsSync(path.join(ROOT, relativePath))
);

const proxyCandidates = [
  "src/proxy.ts",
  "proxy.ts",
].filter((relativePath) =>
  fs.existsSync(path.join(ROOT, relativePath))
);

if (middlewareCandidates.length > 0) {
  failed = true;
  console.log(
    "❌ Ancien middleware actif :",
    middlewareCandidates.join(", ")
  );
} else {
  console.log(
    "✅ Aucun middleware actif déprécié"
  );
}

if (proxyCandidates.length > 0) {
  console.log(
    "✅ Proxy Next.js :",
    proxyCandidates.join(", ")
  );
} else {
  console.log(
    "⚠️ Aucun proxy détecté"
  );
}

console.log("");

if (failed) {
  console.log("Phase 35E-2 incomplète.");
  process.exit(1);
}

console.log("✅ Phase 35E-2 validée.");
