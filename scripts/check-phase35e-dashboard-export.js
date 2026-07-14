const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const filePath = path.join(
  ROOT,
  "src",
  "lib",
  "dashboard",
  "roleDashboard.ts"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ roleDashboard.ts introuvable.");
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf8");

const checks = [
  {
    label: "Export getRoleDashboardData",
    ok:
      /export\s+async\s+function\s+getRoleDashboardData\s*\(/.test(
        source
      ) ||
      /export\s+const\s+getRoleDashboardData\s*=/.test(source),
  },
  {
    label: "Export getRoleDashboardConfig",
    ok:
      /export\s+async\s+function\s+getRoleDashboardConfig\s*\(/.test(
        source
      ) ||
      /export\s+const\s+getRoleDashboardConfig\s*=/.test(source),
  },
];

let failed = false;

for (const check of checks) {
  console.log(check.ok ? "✅" : "❌", check.label);

  if (!check.ok) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log(
  "✅ Compatibilité dashboard Phase 35E validée."
);
