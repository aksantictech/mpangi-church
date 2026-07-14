const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const REPORT = path.join(ROOT, "MOBILE_STABILITY_REPORT_V2.md");
const JSON_REPORT = path.join(
  ROOT,
  "mobile-stability-report-v2.json"
);

const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);

const patterns = [
  {
    code: "TABLE",
    weight: 4,
    regex: /<table\b/g,
    message: "Tableau à rendre scrollable ou à doubler avec des cartes mobiles.",
  },
  {
    code: "FIXED_WIDTH",
    weight: 4,
    regex: /\b(?:w|min-w|max-w)-\[(?:[5-9]\d{2,}|[1-9]\d{3,})px\]/g,
    message: "Largeur fixe importante susceptible de dépasser l’écran.",
  },
  {
    code: "WHITESPACE_NOWRAP",
    weight: 2,
    regex: /\bwhitespace-nowrap\b/g,
    message: "Texte non sécable à vérifier sur téléphone.",
  },
  {
    code: "LARGE_TEXT",
    weight: 2,
    regex: /\btext-(?:6xl|7xl|8xl|9xl)\b/g,
    message: "Titre très grand à contrôler sur 320–390 px.",
  },
  {
    code: "FIXED_POSITION",
    weight: 3,
    regex: /\bfixed\b/g,
    message: "Élément fixe : vérifier chevauchements et safe areas.",
  },
  {
    code: "ABSOLUTE",
    weight: 1,
    regex: /\babsolute\b/g,
    message: "Position absolue à contrôler sur petits écrans.",
  },
  {
    code: "OVERFLOW_HIDDEN",
    weight: 2,
    regex: /\boverflow-hidden\b/g,
    message: "Peut masquer un texte ou une action sur mobile.",
  },
  {
    code: "GRID_4_PLUS",
    weight: 2,
    regex: /\bgrid-cols-(?:4|5|6|7|8|9|10|11|12)\b/g,
    message: "Grille dense à prévoir en une colonne sur mobile.",
  },
  {
    code: "LONG_FORM",
    weight: 3,
    regex: /<(?:input|select|textarea)\b/g,
    message: "Formulaire : vérifier empilement, labels et boutons.",
  },
];

function walk(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name.endsWith(".bak")
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const results = [];

for (const filePath of walk(SRC)) {
  const source = fs.readFileSync(filePath, "utf8");
  const issues = [];

  for (const pattern of patterns) {
    const matches = source.match(pattern.regex) || [];

    if (matches.length > 0) {
      issues.push({
        code: pattern.code,
        count: matches.length,
        weight: pattern.weight,
        score: matches.length * pattern.weight,
        message: pattern.message,
      });
    }
  }

  if (issues.length > 0) {
    results.push({
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      score: issues.reduce((total, item) => total + item.score, 0),
      issues,
    });
  }
}

results.sort((a, b) => b.score - a.score);

const pageResults = results.filter((item) =>
  /\/page\.(tsx|jsx)$/.test(item.file)
);

const reportLines = [
  "# Audit mobile V2 — Mpangi-church",
  "",
  `Fichiers analysés : ${walk(SRC).length}`,
  `Fichiers avec avertissements : ${results.length}`,
  `Pages avec avertissements : ${pageResults.length}`,
  "",
  "## Priorité P1",
  "",
];

for (const item of pageResults.slice(0, 20)) {
  reportLines.push(`### ${item.file} — score ${item.score}`);
  reportLines.push("");

  for (const issue of item.issues) {
    reportLines.push(
      `- **${issue.code}** × ${issue.count} — ${issue.message}`
    );
  }

  reportLines.push("");
}

reportLines.push("## Tous les fichiers");
reportLines.push("");

for (const item of results) {
  reportLines.push(`- ${item.file} — ${item.score}`);
}

fs.writeFileSync(REPORT, reportLines.join("\n"), "utf8");
fs.writeFileSync(
  JSON_REPORT,
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log("");
console.log("Audit mobile V2 terminé.");
console.log("Rapport :", path.basename(REPORT));
console.log("JSON    :", path.basename(JSON_REPORT));
console.log("");
console.log("Top pages P1 :");

for (const item of pageResults.slice(0, 12)) {
  console.log(`- ${item.file} (${item.score})`);
}
