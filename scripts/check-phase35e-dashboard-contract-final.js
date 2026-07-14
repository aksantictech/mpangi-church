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

const routePath = path.join(
  ROOT,
  "src",
  "app",
  "api",
  "dashboard",
  "role",
  "route.ts"
);

let failed = false;

if (!fs.existsSync(helperPath)) {
  console.log("❌ roleDashboard.ts introuvable.");
  process.exit(1);
}

const helper = fs.readFileSync(helperPath, "utf8");

const helperChecks = [
  [
    "getRoleDashboardData présent",
    /export\s+async\s+function\s+getRoleDashboardData\s*\(/.test(
      helper
    ) ||
      /export\s+const\s+getRoleDashboardData\s*=/.test(helper),
  ],
  [
    "getRoleDashboardConfig synchrone",
    /export\s+function\s+getRoleDashboardConfig\s*\(/.test(
      helper
    ) &&
      !/export\s+async\s+function\s+getRoleDashboardConfig\s*\(/.test(
        helper
      ),
  ],
  [
    "Type cards explicite",
    /cards:\s*LegacyRoleDashboardCard\[\]/.test(helper),
  ],
  [
    "Création systématique des cards",
    /cards:\s*createLegacyCards\(metrics\)/.test(helper),
  ],
  [
    "Compatibilité dynamique",
    /\[key:\s*string\]:\s*any/.test(helper),
  ],
];

for (const [label, ok] of helperChecks) {
  console.log(ok ? "✅" : "❌", label);
  if (!ok) failed = true;
}

if (fs.existsSync(routePath)) {
  const route = fs.readFileSync(routePath, "utf8");

  const protectedCards =
    route.includes(
      "Array.isArray(config.cards) ? config.cards : []"
    ) ||
    !route.includes("config.cards.map");

  console.log(
    protectedCards ? "✅" : "❌",
    "Protection route config.cards"
  );

  if (!protectedCards) failed = true;
}

if (failed) {
  console.log("");
  console.log("❌ Contrat dashboard encore incomplet.");
  process.exit(1);
}

console.log("");
console.log(
  "✅ Contrat dashboard Phase 35E définitivement validé."
);
