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
    label: "Type de base explicite",
    ok:
      /export type LegacyRoleDashboardBaseConfig = \{/.test(
        source
      ),
  },
  {
    label: "Defaults utilisant le type de base",
    ok:
      /const defaults:\s*Record<string,\s*LegacyRoleDashboardBaseConfig>\s*=/.test(
        source
      ),
  },
  {
    label: "Config explicitement typée",
    ok:
      /const config:\s*LegacyRoleDashboardBaseConfig\s*=/.test(
        source
      ),
  },
  {
    label: "Title retourné explicitement",
    ok: /title:\s*config\.title/.test(source),
  },
  {
    label: "Subtitle retourné explicitement",
    ok: /subtitle:\s*config\.subtitle/.test(source),
  },
  {
    label: "Focus retourné explicitement",
    ok: /focus:\s*config\.focus/.test(source),
  },
  {
    label: "Ancien Omit supprimé",
    ok:
      !/Omit<LegacyRoleDashboardConfig,\s*"role"\s*\|\s*"cards">/.test(
        source
      ),
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
  console.log("");
  console.log(
    "❌ Le contrat TypeScript du dashboard reste incomplet."
  );
  process.exit(1);
}

console.log("");
console.log(
  "✅ Typage dashboard Phase 35E définitivement validé."
);
