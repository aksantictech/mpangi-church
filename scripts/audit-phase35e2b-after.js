const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();

const auditScript = path.join(
  ROOT,
  "scripts",
  "audit-phase35e2-security.js"
);

if (!fs.existsSync(auditScript)) {
  console.error(
    "❌ audit-phase35e2-security.js introuvable."
  );
  process.exit(1);
}

const execution = spawnSync(
  process.execPath,
  [auditScript],
  {
    cwd: ROOT,
    stdio: "inherit",
  }
);

if (execution.status !== 0) {
  process.exit(execution.status || 1);
}

const jsonPath = path.join(
  ROOT,
  "phase35e2-security-audit.json"
);

if (!fs.existsSync(jsonPath)) {
  console.error(
    "❌ Rapport JSON de sécurité introuvable."
  );
  process.exit(1);
}

const report = JSON.parse(
  fs.readFileSync(jsonPath, "utf8")
);

const priorityPatterns = [
  /api\/finance\/reports\/export/,
  /api\/members\/actions/,
  /settings\/users\/new\/actions/,
  /finance\/actions/,
  /finance\/budgets\/actions/,
  /finance\/donations\/actions/,
  /patrimony\/actions/,
  /administration\/correspondence\/actions/,
  /administration\/minutes\/actions/,
  /administration\/tasks\/actions/,
  /administration\/transmissions\/actions/,
  /api\/attendance\/event-presence/,
  /api\/attendance\/export/,
  /api\/attendance\/scan/,
  /api\/souls\/.*convert-to-member/,
];

const remainingPriority = (
  report.unguardedActions || []
).filter((item) =>
  priorityPatterns.some((pattern) =>
    pattern.test(String(item.file || ""))
  )
);

const unguardedLayouts = (
  report.layouts || []
).filter((item) => !item.guarded);

const markdown = [
  "# Résultat Phase 35E-2B",
  "",
  `Layouts sans garde : ${unguardedLayouts.length}`,
  `Priorités 1 et 2 encore sans garde détectée : ${remainingPriority.length}`,
  `Total actions/routes sans garde détectée : ${(report.unguardedActions || []).length}`,
  "",
  "## Layouts restants",
  "",
  ...(unguardedLayouts.length
    ? unguardedLayouts.map(
        (item) => `- ${item.layout}`
      )
    : ["- Aucun"]),
  "",
  "## Priorités sensibles restantes",
  "",
  ...(remainingPriority.length
    ? remainingPriority.map(
        (item) => `- ${item.file}`
      )
    : ["- Aucune"]),
  "",
  "Les routes publiques Bible, PWA, manifeste, icônes et formulaires publics ne doivent pas recevoir automatiquement une garde utilisateur authentifiée.",
];

fs.writeFileSync(
  path.join(
    ROOT,
    "PHASE35E2B_AFTER_REPORT.md"
  ),
  markdown.join("\n"),
  "utf8"
);

console.log("");
console.log(
  "Layouts restants :",
  unguardedLayouts.length
);
console.log(
  "Priorités sensibles restantes :",
  remainingPriority.length
);
console.log(
  "Rapport : PHASE35E2B_AFTER_REPORT.md"
);
