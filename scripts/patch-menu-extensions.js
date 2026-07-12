const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const registryPath = path.join(ROOT, "src", "lib", "modules", "moduleRegistry.ts");

if (!fs.existsSync(registryPath)) {
  console.log("moduleRegistry.ts introuvable. Le module reste accessible via /extensions.");
  process.exit(0);
}

let source = fs.readFileSync(registryPath, "utf8");
const original = source;

if (source.includes("extension_activities") || source.includes("/extensions")) {
  console.log("Le menu Extensions semble déjà enregistré.");
  process.exit(0);
}

// Ajouter les icônes si l'import lucide-react existe.
source = source.replace(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];/, (match, icons) => {
  const wanted = ["Network", "Activity", "BarChart3", "Building2"];
  const current = icons.split(",").map((icon) => icon.trim()).filter(Boolean);
  for (const icon of wanted) {
    if (!current.includes(icon)) current.push(icon);
  }
  return `import { ${current.join(", ")} } from "lucide-react";`;
});

const groupSnippet = `
  {
    key: "extensions",
    title: "Volet extensions",
    description: "Rapports hebdomadaires des extensions",
    icon: Network,
    items: [
      {
        code: "extension_activities",
        label: "Extensions",
        href: "/extensions",
        icon: Building2,
      },
      {
        code: "extension_activities",
        label: "Activités",
        href: "/extensions/activities",
        icon: Activity,
      },
      {
        code: "extension_activities",
        label: "Synthèse",
        href: "/extensions/reports",
        icon: BarChart3,
      },
    ],
  },`;

// Stratégies prudentes selon la structure du registry.
if (/export\s+const\s+MENU_GROUPS\s*=\s*\[/.test(source)) {
  source = source.replace(/export\s+const\s+MENU_GROUPS\s*=\s*\[/, (match) => `${match}${groupSnippet}`);
} else if (/export\s+const\s+MODULE_GROUPS\s*=\s*\[/.test(source)) {
  source = source.replace(/export\s+const\s+MODULE_GROUPS\s*=\s*\[/, (match) => `${match}${groupSnippet}`);
} else if (/const\s+MENU_GROUPS\s*=\s*\[/.test(source)) {
  source = source.replace(/const\s+MENU_GROUPS\s*=\s*\[/, (match) => `${match}${groupSnippet}`);
} else if (/const\s+MODULE_GROUPS\s*=\s*\[/.test(source)) {
  source = source.replace(/const\s+MODULE_GROUPS\s*=\s*\[/, (match) => `${match}${groupSnippet}`);
} else {
  console.log("Structure de moduleRegistry non reconnue. Ajoute manuellement le snippet de PATCH_MENU_EXTENSIONS.md");
  process.exit(0);
}

if (source !== original) {
  const backupPath = `${registryPath}.extensions.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(registryPath, backupPath);
  fs.writeFileSync(registryPath, source, "utf8");
  console.log("Menu Extensions ajouté dans", path.relative(ROOT, registryPath));
} else {
  console.log("Aucune modification effectuée.");
}
