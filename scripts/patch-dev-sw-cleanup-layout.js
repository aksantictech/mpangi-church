const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("src/app/layout.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const original = source;

if (!source.includes("@/components/pwa/DevServiceWorkerCleanup")) {
  source =
    'import DevServiceWorkerCleanup from "@/components/pwa/DevServiceWorkerCleanup";\n' +
    source;
}

if (!source.includes("<DevServiceWorkerCleanup />")) {
  const bodyRegex = /<body([^>]*)>/;

  if (!bodyRegex.test(source)) {
    console.error("Balise <body> non trouvée dans src/app/layout.tsx.");
    process.exit(1);
  }

  source = source.replace(
    bodyRegex,
    "<body$1>\n        <DevServiceWorkerCleanup />"
  );
}

if (source !== original) {
  const backupPath = `${layoutPath}.dev-sw-cleanup.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(layoutPath, backupPath);
  }

  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("DevServiceWorkerCleanup ajouté dans src/app/layout.tsx.");
  console.log("Backup :", path.relative(ROOT, backupPath));
} else {
  console.log("layout.tsx déjà configuré.");
}
