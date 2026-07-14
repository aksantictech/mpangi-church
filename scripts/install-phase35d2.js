const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("❌ src/app/layout.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const backupPath = `${layoutPath}.phase35d2.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(layoutPath, backupPath);
  console.log("✅ Backup layout créé.");
}

if (!source.includes("@/styles/mobile-forms-hardening.css")) {
  source =
    `import "@/styles/mobile-forms-hardening.css";\n` +
    source;

  console.log("✅ CSS formulaires mobile importé.");
} else {
  console.log("ℹ️ CSS formulaires mobile déjà importé.");
}

if (!source.includes("MobileFormsEnhancer")) {
  const importLines = source.match(
    /^(?:import[\s\S]*?;\s*\n)+/
  );

  if (!importLines) {
    console.error("❌ Bloc d'import du layout non reconnu.");
    process.exit(1);
  }

  const insertionPoint = importLines[0].length;

  source =
    source.slice(0, insertionPoint) +
    `import MobileFormsEnhancer from "@/components/mobile/MobileFormsEnhancer";\n` +
    source.slice(insertionPoint);

  console.log("✅ MobileFormsEnhancer importé.");
}

if (
  source.includes("<MobileFormsEnhancer />") ||
  source.includes("<MobileFormsEnhancer/>")
) {
  console.log("ℹ️ MobileFormsEnhancer déjà monté.");
} else {
  const bodyRegex = /<body([^>]*)>/m;

  if (!bodyRegex.test(source)) {
    console.error("❌ Balise <body> du layout non reconnue.");
    process.exit(1);
  }

  source = source.replace(
    bodyRegex,
    (match) => `${match}\n        <MobileFormsEnhancer />`
  );

  console.log("✅ MobileFormsEnhancer monté dans <body>.");
}

fs.writeFileSync(layoutPath, source, "utf8");

console.log("");
console.log("✅ Phase 35D-2 installée.");
