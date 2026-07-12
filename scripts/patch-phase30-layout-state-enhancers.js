const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("src/app/layout.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const original = source;

if (!source.includes("@/styles/empty-tables.css")) {
  source = `import "@/styles/empty-tables.css";\n` + source;
}

if (!source.includes("@/components/common/EmptyTablesEnhancer")) {
  source =
    `import EmptyTablesEnhancer from "@/components/common/EmptyTablesEnhancer";\n` +
    source;
}

if (!source.includes("<EmptyTablesEnhancer />")) {
  const bodyRegex = /<body([^>]*)>/;

  if (bodyRegex.test(source)) {
    source = source.replace(bodyRegex, `<body$1>\n        <EmptyTablesEnhancer />`);
  } else {
    console.error("Balise <body> non trouvée dans src/app/layout.tsx.");
    process.exit(1);
  }
}

if (source !== original) {
  const backupPath = `${layoutPath}.phase30-state-enhancers.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(layoutPath, backupPath);
  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("layout.tsx patché avec EmptyTablesEnhancer.");
  console.log("Backup :", path.relative(ROOT, backupPath));
} else {
  console.log("layout.tsx déjà configuré.");
}
