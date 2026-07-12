const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      walk(fullPath, results);
    } else if (entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }

  return results;
}

const files = walk(APP_DIR);
const replacements = [
  [/bg-black/g, "bg-[#F5F9FC]"],
  [/bg-\[#000\]/g, "bg-[#F5F9FC]"],
  [/bg-slate-950/g, "bg-[#F5F9FC]"],
  [/bg-neutral-950/g, "bg-[#F5F9FC]"],
  [/bg-zinc-950/g, "bg-[#F5F9FC]"],
];

const results = [];

for (const filePath of files) {
  let source = fs.readFileSync(filePath, "utf8");
  const original = source;
  let changes = 0;

  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, () => {
      changes++;
      return replacement;
    });
  }

  if (source !== original) {
    const backup = `${filePath}.background.bak`;
    if (!fs.existsSync(backup)) fs.copyFileSync(filePath, backup);
    fs.writeFileSync(filePath, source, "utf8");
    results.push({
      file: path.relative(ROOT, filePath).replaceAll("\\", "/"),
      changes,
    });
  }
}

const report = [
  "# Patch fonds noirs",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  results.length === 0
    ? "Aucun fond noir détecté."
    : [
        "| Fichier | Changements |",
        "|---|---:|",
        ...results.map((row) => `| \`${row.file}\` | ${row.changes} |`),
      ].join("\n"),
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "PAGE_BACKGROUND_PATCH_REPORT.md"), report, "utf8");

console.log("Patch fonds terminé.");
console.log("Fichiers modifiés :", results.length);
console.log("Rapport : PAGE_BACKGROUND_PATCH_REPORT.md");
