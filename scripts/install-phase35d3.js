const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("❌ src/app/layout.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const backupPath = `${layoutPath}.phase35d3.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(layoutPath, backupPath);
  console.log("✅ Backup layout créé.");
}

if (!source.includes("@/styles/mobile-tables-lists.css")) {
  source =
    `import "@/styles/mobile-tables-lists.css";\n` +
    source;

  console.log("✅ CSS tableaux/listes mobile importé.");
} else {
  console.log("ℹ️ CSS tableaux/listes déjà importé.");
}

if (!source.includes("MobileListsTablesEnhancer")) {
  const importBlock = source.match(
    /^(?:import[\s\S]*?;\s*\n)+/
  );

  if (!importBlock) {
    console.error("❌ Bloc d'import du layout non reconnu.");
    process.exit(1);
  }

  const insertionPoint = importBlock[0].length;

  source =
    source.slice(0, insertionPoint) +
    `import MobileListsTablesEnhancer from "@/components/mobile/MobileListsTablesEnhancer";\n` +
    source.slice(insertionPoint);

  console.log("✅ MobileListsTablesEnhancer importé.");
}

if (
  source.includes("<MobileListsTablesEnhancer />") ||
  source.includes("<MobileListsTablesEnhancer/>")
) {
  console.log("ℹ️ MobileListsTablesEnhancer déjà monté.");
} else {
  const bodyRegex = /<body([^>]*)>/m;

  if (!bodyRegex.test(source)) {
    console.error("❌ Balise <body> non reconnue.");
    process.exit(1);
  }

  source = source.replace(
    bodyRegex,
    (match) =>
      `${match}\n        <MobileListsTablesEnhancer />`
  );

  console.log(
    "✅ MobileListsTablesEnhancer monté dans <body>."
  );
}

fs.writeFileSync(layoutPath, source, "utf8");

console.log("");
console.log("✅ Phase 35D-3 installée.");
