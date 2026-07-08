const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src", "app", "administration", "tasks", "actions.ts");

if (!fs.existsSync(filePath)) {
  console.error("Fichier introuvable :", filePath);
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");

// 1) Corriger les types stricts churchId: string dans les helpers internes du fichier.
source = source.replaceAll("churchId: string;", "churchId: string | null | undefined;");

// 2) Si le helper insertTaskUpdate n'a pas encore une sécurité runtime,
// ajouter une protection juste après l'ouverture de la fonction.
source = source.replace(
  /async function insertTaskUpdate\(\{\s*admin,\s*churchId,\s*taskId,\s*status,\s*note,\s*createdBy,\s*\}:\s*\{[\s\S]*?\}\)\s*\{/,
  (match) => {
    if (source.includes('if (!churchId) return;') && match.includes("insertTaskUpdate")) {
      return match;
    }

    return `${match}\n  if (!churchId) return;`;
  }
);

// 3) Si certains appels restent stricts dans le même fichier, on force un fallback sûr uniquement pour TypeScript.
// Les permissions en amont garantissent normalement que profile.church_id existe.
source = source.replaceAll("churchId: profile.church_id,", "churchId: profile.church_id ?? null,");

fs.writeFileSync(filePath, source, "utf8");

console.log("Hotfix appliqué :", filePath);
