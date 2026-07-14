const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
const installTemplatePath = path.join(
  ROOT,
  "patches",
  "install-page.tsx"
);
const installPagePath = path.join(
  ROOT,
  "src",
  "app",
  "install",
  "page.tsx"
);
const swPath = path.join(ROOT, "public", "sw.js");
const swTemplatePath = path.join(
  ROOT,
  "public",
  "sw-phase35d4-template.js"
);

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log("✅ Backup :", path.relative(ROOT, backupPath));
  }
}

function patchLayout() {
  if (!fs.existsSync(layoutPath)) {
    console.error("❌ src/app/layout.tsx introuvable.");
    process.exit(1);
  }

  let source = fs.readFileSync(layoutPath, "utf8");
  backup(layoutPath, "phase35d4");

  if (!source.includes("@/styles/mobile-experience-35d4.css")) {
    source =
      `import "@/styles/mobile-experience-35d4.css";\n` +
      source;
  }

  const imports = [
    {
      symbol: "MobileRouteExperienceEnhancer",
      line:
        'import MobileRouteExperienceEnhancer from "@/components/mobile/MobileRouteExperienceEnhancer";\n',
    },
    {
      symbol: "PwaInstallCoordinator",
      line:
        'import PwaInstallCoordinator from "@/components/pwa/PwaInstallCoordinator";\n',
    },
  ];

  for (const item of imports) {
    if (source.includes(item.symbol)) continue;

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
      item.line +
      source.slice(insertionPoint);
  }

  const bodyRegex = /<body([^>]*)>/m;

  if (!bodyRegex.test(source)) {
    console.error("❌ Balise <body> non reconnue.");
    process.exit(1);
  }

  const mounts = [
    "<PwaInstallCoordinator />",
    "<MobileRouteExperienceEnhancer />",
  ];

  for (const mount of mounts) {
    if (source.includes(mount)) continue;

    source = source.replace(
      bodyRegex,
      (match) => `${match}\n        ${mount}`
    );
  }

  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("✅ Layout Phase 35D-4 stabilisé.");
}

function installPwaPage() {
  if (!fs.existsSync(installTemplatePath)) {
    console.error("❌ Template de page install absent.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(installPagePath), {
    recursive: true,
  });

  backup(installPagePath, "phase35d4");

  fs.copyFileSync(installTemplatePath, installPagePath);
  console.log("✅ Page /install remplacée par la version robuste.");
}

function ensureServiceWorker() {
  fs.mkdirSync(path.dirname(swPath), {
    recursive: true,
  });

  if (fs.existsSync(swPath)) {
    console.log(
      "ℹ️ public/sw.js existe déjà : il est conservé."
    );
    return;
  }

  fs.copyFileSync(swTemplatePath, swPath);
  console.log("✅ Service worker minimal créé.");
}

patchLayout();
installPwaPage();
ensureServiceWorker();

console.log("");
console.log("✅ Phase 35D-4 installée.");
