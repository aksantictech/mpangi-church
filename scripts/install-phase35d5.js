const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

const loadingTargets = [
  {
    target: "src/app/dashboard/loading.tsx",
    template: "templates/loading/dashboard-loading.tsx",
  },
  {
    target: "src/app/super-admin/dashboard/loading.tsx",
    template: "templates/loading/dashboard-loading.tsx",
  },
  {
    target: "src/app/church/[slug]/loading.tsx",
    template: "templates/loading/public-church-loading.tsx",
  },
  {
    target: "src/app/attendance/scanner/loading.tsx",
    template: "templates/loading/scanner-loading.tsx",
  },
  {
    target: "src/app/notifications/loading.tsx",
    template: "templates/loading/notifications-loading.tsx",
  },
];

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

  backup(layoutPath, "phase35d5");

  if (!source.includes("@/styles/mobile-performance-35d5.css")) {
    source =
      `import "@/styles/mobile-performance-35d5.css";\n` +
      source;

    console.log("✅ CSS performance mobile importé.");
  }

  if (!source.includes("MobilePerformanceCoordinator")) {
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
      'import MobilePerformanceCoordinator from "@/components/mobile/MobilePerformanceCoordinator";\n' +
      source.slice(insertionPoint);

    console.log("✅ MobilePerformanceCoordinator importé.");
  }

  if (!source.includes("<MobilePerformanceCoordinator />")) {
    const bodyRegex = /<body([^>]*)>/m;

    if (!bodyRegex.test(source)) {
      console.error("❌ Balise <body> non reconnue.");
      process.exit(1);
    }

    source = source.replace(
      bodyRegex,
      (match) =>
        `${match}\n        <MobilePerformanceCoordinator />`
    );

    console.log("✅ MobilePerformanceCoordinator monté.");
  }

  fs.writeFileSync(layoutPath, source, "utf8");
}

function installLoadings() {
  for (const item of loadingTargets) {
    const targetPath = path.join(ROOT, item.target);
    const templatePath = path.join(ROOT, item.template);

    if (!fs.existsSync(templatePath)) {
      console.log("⚠️ Template absent :", item.template);
      continue;
    }

    if (fs.existsSync(targetPath)) {
      console.log("ℹ️ Loading existant conservé :", item.target);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), {
      recursive: true,
    });

    fs.copyFileSync(templatePath, targetPath);
    console.log("✅ Loading ajouté :", item.target);
  }
}

function patchGitignore() {
  const gitignorePath = path.join(ROOT, ".gitignore");
  let source = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : "";

  const rules = [
    "*.bak",
    "*.before-*.bak",
    ".maintenance-backups/",
    "mobile-performance-report.json",
    "public-assets-report.json",
    "backup-files-report.json",
  ];

  for (const rule of rules) {
    const lines = source.split(/\r?\n/);

    if (!lines.includes(rule)) {
      source += `${source.endsWith("\n") || !source ? "" : "\n"}${rule}\n`;
    }
  }

  fs.writeFileSync(gitignorePath, source, "utf8");
  console.log("✅ .gitignore maintenance mis à jour.");
}

patchLayout();
installLoadings();
patchGitignore();

console.log("");
console.log("✅ Phase 35D-5 installée.");
