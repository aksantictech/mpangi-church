const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/lib/security/roleValidation.ts",
  "src/app/settings/security-validation/layout.tsx",
  "src/app/settings/security-validation/page.tsx",
  "src/app/api/security/validation/route.ts",
  "scripts/install-phase35e4.js",
  "scripts/audit-role-matrix-phase35e4.js",
  "scripts/generate-phase35e4-real-checklist.js",
  "scripts/run-phase35e4-validation.js",
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

const navigationPath = path.join(
  ROOT,
  "src/lib/security/permissionNavigation.ts"
);

if (fs.existsSync(navigationPath)) {
  const source = fs.readFileSync(
    navigationPath,
    "utf8"
  );

  const ok = source.includes(
    'href: "/settings/security-validation"'
  );

  console.log(
    ok ? "✅" : "⚠️",
    "Lien Validation des rôles"
  );
}

if (failed) {
  console.log("");
  console.log("Phase 35E-4 incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35E-4 validée.");
