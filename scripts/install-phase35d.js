const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
const mobileNavPath = path.join(
  ROOT,
  "src",
  "components",
  "layout",
  "MobileBottomNav.tsx"
);
const publicNavPath = path.join(
  ROOT,
  "src",
  "components",
  "public",
  "PublicMobileBottomNav.tsx"
);

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function installCssImport() {
  if (!fs.existsSync(layoutPath)) {
    console.error("❌ src/app/layout.tsx introuvable.");
    process.exitCode = 1;
    return;
  }

  let source = fs.readFileSync(layoutPath, "utf8");

  if (source.includes("@/styles/mobile-hardening.css")) {
    console.log("ℹ️ mobile-hardening.css déjà importé.");
    return;
  }

  backup(layoutPath, "phase35d");
  source = `import "@/styles/mobile-hardening.css";\n${source}`;
  fs.writeFileSync(layoutPath, source, "utf8");

  console.log("✅ mobile-hardening.css ajouté dans layout.tsx.");
}

function removeBrokenInternalMenuItem() {
  if (!fs.existsSync(mobileNavPath)) {
    console.log(
      "⚠️ MobileBottomNav.tsx introuvable. Aucun patch de navigation interne."
    );
    return;
  }

  let source = fs.readFileSync(mobileNavPath, "utf8");
  const original = source;

  backup(mobileNavPath, "phase35d");

  // Supprime les objets de navigation vers /mobile-menu ou portant le label Menu.
  source = source.replace(
    /\s*\{\s*(?=[\s\S]{0,280}(?:href:\s*["']\/mobile-menu["']|label:\s*["']Menu["']))[\s\S]{0,320}?\},?/g,
    ""
  );

  // Supprime les liens JSX directs vers /mobile-menu.
  source = source.replace(
    /\s*<Link\b[\s\S]{0,220}?href=["']\/mobile-menu["'][\s\S]{0,420}?<\/Link>/g,
    ""
  );

  // Nettoyage des virgules et espaces.
  source = source
    .replace(/,\s*,/g, ",")
    .replace(/\[\s*,/g, "[")
    .replace(/,\s*\]/g, "]")
    .replace(/\n{4,}/g, "\n\n\n");

  if (source !== original) {
    fs.writeFileSync(mobileNavPath, source, "utf8");
    console.log(
      "✅ Entrée mobile cassée « Menu » supprimée de MobileBottomNav."
    );
  } else {
    console.log(
      "ℹ️ Aucun lien /mobile-menu détecté dans MobileBottomNav."
    );
  }
}

function checkPublicNavigation() {
  if (!fs.existsSync(publicNavPath)) {
    console.log(
      "⚠️ PublicMobileBottomNav.tsx introuvable."
    );
    return;
  }

  const source = fs.readFileSync(publicNavPath, "utf8");

  const hasBible =
    source.includes("/bible") || source.includes("Bible");
  const hasDonation =
    source.includes("/don") || source.includes("Don");

  console.log(
    hasBible
      ? "✅ Menu public Bible détecté."
      : "⚠️ Menu public Bible absent."
  );

  console.log(
    hasDonation
      ? "✅ Menu public Don détecté."
      : "⚠️ Menu public Don absent."
  );
}

installCssImport();
removeBrokenInternalMenuItem();
checkPublicNavigation();

console.log("");
console.log("Phase 35D — socle mobile installée.");
console.log(
  "Lancez ensuite : node scripts/audit-mobile-pages-v2.js"
);
