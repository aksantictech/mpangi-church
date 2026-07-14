const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const helperPath = path.join(
  ROOT,
  "src",
  "lib",
  "dashboard",
  "roleDashboard.ts"
);

if (!fs.existsSync(helperPath)) {
  console.error("❌ roleDashboard.ts introuvable.");
  process.exit(1);
}

const source = fs.readFileSync(helperPath, "utf8");

const checks = [
  {
    label: "getRoleDashboardData présent",
    ok:
      /export\s+async\s+function\s+getRoleDashboardData\s*\(/.test(
        source
      ) ||
      /export\s+const\s+getRoleDashboardData\s*=/.test(source),
  },
  {
    label: "getRoleDashboardConfig synchrone",
    ok:
      /export\s+function\s+getRoleDashboardConfig\s*\(/.test(
        source
      ) &&
      !/export\s+async\s+function\s+getRoleDashboardConfig\s*\(/.test(
        source
      ),
  },
  {
    label: "Propriété role",
    ok: /\brole,\s*\n\s*\.\.\.config/.test(source),
  },
  {
    label: "Propriétés title/subtitle/focus",
    ok:
      source.includes("title:") &&
      source.includes("subtitle:") &&
      source.includes("focus:"),
  },
];

let failed = false;

for (const check of checks) {
  console.log(check.ok ? "✅" : "❌", check.label);

  if (!check.ok) failed = true;
}

if (failed) process.exit(1);

console.log("");
console.log(
  "✅ Adaptateur dashboard synchrone validé."
);
