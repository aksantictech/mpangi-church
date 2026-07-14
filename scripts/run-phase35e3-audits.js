const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const scripts = [
  "scripts/audit-multitenancy-phase35e3.js",
  "scripts/audit-route-security-phase35e3.js",
  "scripts/generate-phase35e3-test-plan.js",
];

let failed = false;

for (const script of scripts) {
  console.log("\n▶", script);
  const result = spawnSync(process.execPath, [path.join(ROOT, script)], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.status !== 0 && result.status !== 2) failed = true;
}

if (failed) process.exit(1);

console.log("\n✅ Audits Phase 35E-3 terminés.");
