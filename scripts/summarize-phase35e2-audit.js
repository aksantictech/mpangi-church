const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const jsonPath = path.join(
  ROOT,
  "phase35e2-security-audit.json"
);

if (!fs.existsSync(jsonPath)) {
  console.error(
    "❌ phase35e2-security-audit.json introuvable."
  );
  console.error(
    "Lancez d'abord : node scripts/audit-phase35e2-security.js"
  );
  process.exit(1);
}

const report = JSON.parse(
  fs.readFileSync(jsonPath, "utf8")
);

const unguardedLayouts = (report.layouts || []).filter(
  (item) => !item.guarded
);

const unguardedActions =
  report.unguardedActions || [];

const priority = (item) => {
  const file = String(item.file || "");

  if (
    /members|finance|patrimony|settings\/users|settings\/roles/.test(
      file
    )
  ) {
    return 1;
  }

  if (
    /administration|souls|attendance|public-requests/.test(
      file
    )
  ) {
    return 2;
  }

  return 3;
};

unguardedActions.sort(
  (a, b) =>
    priority(a) - priority(b) ||
    String(a.file).localeCompare(String(b.file))
);

const markdown = [
  "# Priorités Phase 35E-2B",
  "",
  `Layouts sans garde : ${unguardedLayouts.length}`,
  `Actions/routes sans garde détectée : ${unguardedActions.length}`,
  "",
  "## Layouts à corriger",
  "",
  ...(unguardedLayouts.length
    ? unguardedLayouts.map(
        (item) =>
          `- ${item.layout} — route ${item.route} — modules : ${(item.modules || []).join(", ")}`
      )
    : ["- Aucun"]),
  "",
  "## Priorité 1 — données sensibles",
  "",
  ...unguardedActions
    .filter((item) => priority(item) === 1)
    .map((item) => `- ${item.file}`),
  "",
  "## Priorité 2 — opérations métier",
  "",
  ...unguardedActions
    .filter((item) => priority(item) === 2)
    .map((item) => `- ${item.file}`),
  "",
  "## Priorité 3 — autres fichiers",
  "",
  ...unguardedActions
    .filter((item) => priority(item) === 3)
    .map((item) => `- ${item.file}`),
];

const outputPath = path.join(
  ROOT,
  "PHASE35E2B_PRIORITIES.md"
);

fs.writeFileSync(
  outputPath,
  markdown.join("\n"),
  "utf8"
);

console.log(
  "Layouts sans garde :",
  unguardedLayouts.length
);
console.log(
  "Actions/routes sans garde :",
  unguardedActions.length
);

if (unguardedLayouts.length > 0) {
  console.log("");
  console.log("Layout à corriger en premier :");

  for (const item of unguardedLayouts) {
    console.log("-", item.layout);
  }
}

console.log("");
console.log("Rapport : PHASE35E2B_PRIORITIES.md");
