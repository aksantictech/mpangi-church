const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const TARGETS = [
  "src/app/patrimony/assets/[id]/edit/page.tsx",
  "src/app/patrimony/assets/new/page.tsx",
  "src/app/administration/minutes/[id]/edit/page.tsx",
  "src/app/administration/correspondence/new/page.tsx",
  "src/app/administration/minutes/new/page.tsx",
  "src/app/finance/expenses/new/page.tsx",
  "src/app/finance/offerings/new/page.tsx",
  "src/app/super-admin/churches/[id]/page.tsx",
  "src/app/administration/tasks/[id]/edit/page.tsx",
  "src/app/finance/reports/page.tsx",
  "src/app/administration/tasks/new/page.tsx",
  "src/app/departments/page.tsx",
  "src/app/events/page.tsx",
  "src/app/members/page.tsx",
  "src/app/patrimony/maintenance/new/page.tsx",
];

const replacements = [
  // Titres trop grands sur mobile
  [/text-4xl/g, "text-2xl sm:text-3xl lg:text-4xl"],
  [/text-3xl/g, "text-2xl sm:text-3xl"],

  // Sections hero et cards avec padding trop large
  [/p-8/g, "p-5 sm:p-6 lg:p-8"],
  [/p-7/g, "p-5 sm:p-6 lg:p-7"],
  [/p-6/g, "p-5 sm:p-6"],

  // Grilles trop rigides sur mobile
  [/grid gap-5 md:grid-cols-2/g, "grid gap-4 sm:grid-cols-2"],
  [/grid gap-5 md:grid-cols-3/g, "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"],
  [/grid gap-5 xl:grid-cols-2/g, "grid gap-4 xl:grid-cols-2"],
  [/grid gap-4 md:grid-cols-2/g, "grid gap-4 sm:grid-cols-2"],
  [/grid gap-4 md:grid-cols-3/g, "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"],
  [/grid gap-6 md:grid-cols-2/g, "grid gap-4 sm:grid-cols-2"],
  [/grid gap-6 md:grid-cols-3/g, "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"],

  // Flex actions : éviter les boutons écrasés
  [/flex flex-col gap-3 md:flex-row md:justify-end/g, "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end"],
  [/flex flex-col gap-2 md:flex-row md:justify-end/g, "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end"],
  [/flex flex-col justify-between gap-4 md:flex-row md:items-center/g, "flex flex-col justify-between gap-4 sm:flex-row sm:items-center"],

  // Formulaires : inputs plus lisibles mobile
  [/min-h-12 w-full/g, "min-h-12 w-full"],
  [/px-5 py-3/g, "px-4 py-3 sm:px-5"],

  // Tables : forcer table desktop seulement si min-width important
  [/className="w-full min-w-\[1050px\] text-left text-sm"/g, 'className="w-full min-w-[1050px] text-left text-sm"'],
];

function backup(filePath) {
  const backupPath = `${filePath}.mobile-p1.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function patchFile(relPath) {
  const filePath = path.join(ROOT, relPath);

  if (!fs.existsSync(filePath)) {
    return {
      file: relPath,
      status: "missing",
      changes: 0,
    };
  }

  let source = fs.readFileSync(filePath, "utf8");
  const original = source;
  let changes = 0;

  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, (match) => {
      if (match === replacement) return match;
      changes += 1;
      return replacement;
    });
  }

  // Ajouter un padding bas mobile aux pages avec beaucoup de formulaires/actions
  source = source.replace(
    /<div className="space-y-6">/g,
    (match) => {
      changes += 1;
      return '<div className="space-y-6 pb-24 md:pb-0">';
    }
  );

  // Éviter double insertion si le script est lancé deux fois
  source = source.replaceAll('className="space-y-6 pb-24 md:pb-0 pb-24 md:pb-0"', 'className="space-y-6 pb-24 md:pb-0"');

  if (source !== original) {
    backup(filePath);
    fs.writeFileSync(filePath, source, "utf8");
  }

  return {
    file: relPath,
    status: source === original ? "unchanged" : "patched",
    changes,
  };
}

const results = TARGETS.map(patchFile);

const report = [
  "# Patch mobile P1 — formulaires et pages lourdes",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "| Fichier | Statut | Changements |",
  "|---|---|---:|",
  ...results.map((row) => `| \`${row.file}\` | ${row.status} | ${row.changes} |`),
  "",
  "## Notes",
  "",
  "- Un backup `.mobile-p1.bak` est créé pour chaque fichier modifié.",
  "- Le patch est volontairement prudent : il améliore les espacements, titres et grilles sans casser la logique serveur.",
  "- Après build, vérifier les pages P1 sur petit écran.",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "MOBILE_P1_PATCH_REPORT.md"), report, "utf8");

console.log("");
console.log("Patch mobile P1 terminé.");
console.log("Rapport : MOBILE_P1_PATCH_REPORT.md");
console.log("");
for (const row of results) {
  console.log(`${row.status.padEnd(9)} ${String(row.changes).padStart(3)}  ${row.file}`);
}
