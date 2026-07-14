const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (
    fs.existsSync(filePath) &&
    !fs.existsSync(backupPath)
  ) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function patchPermissionNavigation() {
  const filePath = path.join(
    ROOT,
    "src/lib/security/permissionNavigation.ts"
  );

  if (!fs.existsSync(filePath)) {
    console.log(
      "⚠️ permissionNavigation.ts introuvable."
    );
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes(
      'href: "/settings/security-validation"'
    )
  ) {
    console.log(
      "ℹ️ Validation sécurité déjà présente dans la navigation."
    );
    return;
  }

  backup(filePath, "phase35e4");

  const marker = `  {
    code: "security",
    label: "Rôles et accès",
    href: "/settings/roles",
    category: "configuration",
  },`;

  if (!source.includes(marker)) {
    console.log(
      "⚠️ Point d’insertion navigation non reconnu."
    );
    return;
  }

  const addition = `${marker}
  {
    code: "security",
    label: "Validation des rôles",
    href: "/settings/security-validation",
    category: "configuration",
  },`;

  source = source.replace(marker, addition);

  fs.writeFileSync(filePath, source, "utf8");

  console.log(
    "✅ Validation des rôles ajoutée à la navigation."
  );
}

function patchRoutePermissionMap() {
  const filePath = path.join(
    ROOT,
    "src/lib/security/routePermissionMap.ts"
  );

  if (!fs.existsSync(filePath)) {
    console.log(
      "⚠️ routePermissionMap.ts introuvable."
    );
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes(
      'id: "settings-security-validation"'
    )
  ) {
    console.log(
      "ℹ️ Route validation déjà cartographiée."
    );
    return;
  }

  backup(filePath, "phase35e4");

  const marker = `  {
    id: "settings-roles",
    pattern: /^\\/settings\\/roles(?:\\/|$)/,
    modules: ["security"],
    action: "view",
  },`;

  if (!source.includes(marker)) {
    console.log(
      "⚠️ Point d’insertion route non reconnu."
    );
    return;
  }

  const addition = `  {
    id: "settings-security-validation",
    pattern: /^\\/settings\\/security-validation(?:\\/|$)/,
    modules: ["security"],
    action: "view",
  },
${marker}`;

  source = source.replace(marker, addition);

  fs.writeFileSync(filePath, source, "utf8");

  console.log(
    "✅ Route validation des rôles cartographiée."
  );
}

patchPermissionNavigation();
patchRoutePermissionMap();

console.log("");
console.log("✅ Phase 35E-4 installée.");
