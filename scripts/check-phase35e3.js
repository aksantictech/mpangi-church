const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const required = [
  "phase35e3_security_audit.sql",
  "src/lib/security/securityAudit.ts",
  "src/app/settings/security-audit/layout.tsx",
  "src/app/settings/security-audit/page.tsx",
  "src/app/api/security/audit/route.ts",
  "scripts/install-phase35e3.js",
  "scripts/audit-multitenancy-phase35e3.js",
  "scripts/audit-route-security-phase35e3.js",
  "scripts/generate-phase35e3-test-plan.js",
];

let failed = false;

for (const relativePath of required) {
  const ok = fs.existsSync(path.join(ROOT, relativePath));
  console.log(ok ? "✅" : "❌", relativePath);
  if (!ok) failed = true;
}

if (failed) process.exit(1);

console.log("");
console.log("✅ Phase 35E-3 validée.");
