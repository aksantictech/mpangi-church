const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
const registryPath = path.join(
  ROOT,
  "src",
  "lib",
  "modules",
  "moduleRegistry.ts"
);

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

if (!fs.existsSync(layoutPath)) {
  console.error("src/app/layout.tsx introuvable.");
  process.exit(1);
}

let layout = fs.readFileSync(layoutPath, "utf8");
const originalLayout = layout;

if (!layout.includes("@/styles/bible-reader.css")) {
  layout = 'import "@/styles/bible-reader.css";\n' + layout;
}

if (layout !== originalLayout) {
  backup(layoutPath, "phase35b");
  fs.writeFileSync(layoutPath, layout, "utf8");
  console.log("✅ bible-reader.css ajouté dans layout.tsx.");
} else {
  console.log("ℹ️ Style Bible déjà installé.");
}

if (fs.existsSync(registryPath)) {
  let registry = fs.readFileSync(registryPath, "utf8");
  const originalRegistry = registry;

  if (!/\bBookOpen\b/.test(registry)) {
    registry = registry.replace(
      /(\s+Bell,\s*\n)/,
      "$1  BookOpen,\n"
    );
  }

  if (!registry.includes('code: "bible"')) {
    const insertionPoint = `  {
    code: "appointments",`;

    const bibleItem = `  {
    code: "bible",
    label: "Lire la Bible",
    href: "/bible",
    icon: BookOpen,
    category: "spiritual",
    alwaysVisible: true,
  },
`;

    if (registry.includes(insertionPoint)) {
      registry = registry.replace(
        insertionPoint,
        bibleItem + insertionPoint
      );
    } else {
      console.log(
        "⚠️ Point d'insertion du menu Bible non reconnu. Ajoutez le menu manuellement."
      );
    }
  }

  if (registry !== originalRegistry) {
    backup(registryPath, "phase35b");
    fs.writeFileSync(registryPath, registry, "utf8");
    console.log("✅ Menu Lire la Bible ajouté au volet spirituel.");
  } else {
    console.log("ℹ️ Menu Bible déjà présent ou non modifié.");
  }
}

console.log("");
console.log("Phase 35B installée.");
console.log("Ajoutez BIBLE_API_KEY dans .env.local et Vercel.");
