const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const registryPath = path.join(ROOT, "src", "lib", "modules", "moduleRegistry.ts");
const patchDocPath = path.join(ROOT, "PATCH_MENU_EXTENSIONS.md");

if (!fs.existsSync(registryPath)) {
  console.error("moduleRegistry.ts introuvable :", registryPath);
  process.exit(1);
}

let source = fs.readFileSync(registryPath, "utf8");
const original = source;

if (source.includes("extension_activities")) {
  console.log("Le module extension_activities existe déjà dans moduleRegistry.ts");
  process.exit(0);
}

function addLucideIcons(code) {
  return code.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];/,
    (match, imports) => {
      const required = ["Network", "ClipboardList", "BarChart3", "MapPinned"];
      let next = imports;

      for (const icon of required) {
        if (!new RegExp(`\\b${icon}\\b`).test(next)) {
          next += `,\n  ${icon}`;
        }
      }

      return `import {${next}\n} from "lucide-react";`;
    }
  );
}

const groupBlock = `  {
    key: "extensions",
    title: "Extensions",
    description: "Activités des extensions",
    icon: Network,
    items: [
      {
        code: "extension_activities",
        label: "Extensions",
        href: "/extensions",
        icon: MapPinned,
      },
      {
        code: "extension_activities",
        label: "Activités",
        href: "/extensions/activities",
        icon: ClipboardList,
      },
      {
        code: "extension_activities",
        label: "Rapports",
        href: "/extensions/reports",
        icon: BarChart3,
      },
    ],
  },`;

source = addLucideIcons(source);

const candidates = [
  "MODULE_GROUPS",
  "MENU_GROUPS",
  "moduleGroups",
  "menuGroups",
  "navigationGroups",
  "NAVIGATION_GROUPS",
];

let patched = false;

for (const name of candidates) {
  const idx = source.indexOf(name);

  if (idx === -1) continue;

  const arrayStart = source.indexOf("[", idx);
  if (arrayStart === -1) continue;

  let depth = 0;
  let arrayEnd = -1;

  for (let i = arrayStart; i < source.length; i++) {
    if (source[i] === "[") depth++;
    if (source[i] === "]") depth--;

    if (depth === 0) {
      arrayEnd = i;
      break;
    }
  }

  if (arrayEnd === -1) continue;

  source = source.slice(0, arrayEnd) + "\n" + groupBlock + "\n" + source.slice(arrayEnd);
  patched = true;
  break;
}

if (!patched) {
  console.log("Structure de moduleRegistry non reconnue.");
  console.log("Un fichier PATCH_MENU_EXTENSIONS.md a été ajouté avec le snippet manuel.");
  process.exit(0);
}

const backupPath = `${registryPath}.extensions-menu.bak`;
if (!fs.existsSync(backupPath)) fs.copyFileSync(registryPath, backupPath);

fs.writeFileSync(registryPath, source, "utf8");

console.log("moduleRegistry.ts patché avec le groupe Extensions.");
console.log("Backup :", path.relative(ROOT, backupPath));
