const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const EXTENSIONS_DIR = path.join(ROOT, "src", "app", "extensions");

if (!fs.existsSync(EXTENSIONS_DIR)) {
  console.log("Dossier extensions introuvable :", EXTENSIONS_DIR);
  process.exit(0);
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.name.endsWith(".tsx") && entry.name !== "layout.tsx") {
      results.push(fullPath);
    }
  }

  return results;
}

const files = walk(EXTENSIONS_DIR);

const replacements = [
  [/min-h-screen\s+bg-black/g, "min-h-0 bg-transparent"],
  [/min-h-screen\s+bg-\[#000\]/g, "min-h-0 bg-transparent"],
  [/min-h-screen\s+bg-slate-950/g, "min-h-0 bg-transparent"],
  [/min-h-screen\s+bg-neutral-950/g, "min-h-0 bg-transparent"],
  [/min-h-screen\s+bg-zinc-950/g, "min-h-0 bg-transparent"],
  [/bg-black/g, "bg-[#F5F9FC]"],
  [/bg-\[#000\]/g, "bg-[#F5F9FC]"],
];

const results = [];

for (const filePath of files) {
  let source = fs.readFileSync(filePath, "utf8");
  const original = source;
  let changes = 0;

  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, (match) => {
      changes += 1;
      return replacement;
    });
  }

  // Évite les marges énormes si une page était dessinée comme page autonome.
  source = source.replace(/px-0 py-0/g, "px-0 py-0");
  source = source.replace(/className="min-h-0 bg-transparent"/g, 'className="bg-transparent"');

  if (source !== original) {
    const backupPath = `${filePath}.extensions-style.bak`;
    if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, source, "utf8");
    results.push({
      file: path.relative(ROOT, filePath),
      changes,
      status: "patched",
    });
  } else {
    results.push({
      file: path.relative(ROOT, filePath),
      changes: 0,
      status: "unchanged",
    });
  }
}

const report = [
  "# Patch style module Extensions",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "| Fichier | Statut | Changements |",
  "|---|---|---:|",
  ...results.map(
    (row) => `| \`${row.file}\` | ${row.status} | ${row.changes} |`
  ),
  "",
  "Le layout `src/app/extensions/layout.tsx` ajoute maintenant AppShell + barre de navigation Extensions.",
  "Les pages gardent leur logique existante, mais ne doivent plus s'afficher comme des pages autonomes noires.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(ROOT, "EXTENSIONS_STYLE_PATCH_REPORT.md"),
  report,
  "utf8"
);

console.log("Patch style extensions terminé.");
console.log("Rapport : EXTENSIONS_STYLE_PATCH_REPORT.md");

for (const row of results) {
  console.log(`${row.status.padEnd(9)} ${String(row.changes).padStart(3)} ${row.file}`);
}
