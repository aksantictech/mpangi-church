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

if (!source.includes("@/styles/responsive-tables.css")) {
  source = `import "@/styles/responsive-tables.css";\n` + source;
}

if (!source.includes("@/components/mobile/ResponsiveTablesEnhancer")) {
  source =
    `import ResponsiveTablesEnhancer from "@/components/mobile/ResponsiveTablesEnhancer";\n` +
    source;
}

if (!source.includes("<ResponsiveTablesEnhancer />")) {
  const bodyRegex = /<body([^>]*)>/;

  if (bodyRegex.test(source)) {
    source = source.replace(
      bodyRegex,
      `<body$1>\n        <ResponsiveTablesEnhancer />`
    );
  } else {
    console.error("Balise <body> non trouvée dans src/app/layout.tsx.");
    process.exit(1);
  }
}

if (source !== original) {
  const backupPath = `${layoutPath}.phase29-responsive-tables.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(layoutPath, backupPath);
  }

  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("layout.tsx patché avec ResponsiveTablesEnhancer.");
  console.log("Backup :", path.relative(ROOT, backupPath));
} else {
  console.log("layout.tsx déjà configuré.");
}
