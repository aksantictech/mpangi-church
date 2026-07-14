const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const layoutPath = path.join(
  ROOT,
  "src",
  "app",
  "layout.tsx"
);

if (!fs.existsSync(layoutPath)) {
  console.error("❌ src/app/layout.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const backupPath = `${layoutPath}.phase35e2c.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(layoutPath, backupPath);
  console.log("✅ Backup du layout créé.");
}

if (!source.includes("PermissionNavigationDomFilter")) {
  const importBlock = source.match(
    /^(?:import[\s\S]*?;\s*\n)+/
  );

  if (!importBlock) {
    console.error("❌ Bloc d’import du layout non reconnu.");
    process.exit(1);
  }

  const insertionPoint = importBlock[0].length;

  source =
    source.slice(0, insertionPoint) +
    'import PermissionNavigationDomFilter from "@/components/security/PermissionNavigationDomFilter";\n' +
    source.slice(insertionPoint);

  console.log(
    "✅ PermissionNavigationDomFilter importé."
  );
}

if (!source.includes("<PermissionNavigationDomFilter />")) {
  const bodyPattern = /<body([^>]*)>/m;

  if (!bodyPattern.test(source)) {
    console.error("❌ Balise <body> non reconnue.");
    process.exit(1);
  }

  source = source.replace(
    bodyPattern,
    (match) =>
      `${match}\n        <PermissionNavigationDomFilter />`
  );

  console.log(
    "✅ Filtrage des menus monté globalement."
  );
}

fs.writeFileSync(layoutPath, source, "utf8");

const patchScript = path.join(
  ROOT,
  "scripts",
  "fix-phase35e2c-sensitive-routes.js"
);

const result = spawnSync(
  process.execPath,
  [patchScript],
  {
    cwd: ROOT,
    stdio: "inherit",
  }
);

if (result.status !== 0) {
  console.error(
    "❌ Le patch des routes sensibles a rencontré une erreur."
  );
  process.exit(result.status || 1);
}

console.log("");
console.log("✅ Phase 35E-2C installée.");
