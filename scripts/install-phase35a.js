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

if (!source.includes('@/components/pwa/TenantPwaBootstrap')) {
  source = 'import TenantPwaBootstrap from "@/components/pwa/TenantPwaBootstrap";\n' + source;
}

if (!source.includes('@/styles/mobile-production-hardening.css')) {
  source = 'import "@/styles/mobile-production-hardening.css";\n' + source;
}

if (!source.includes("<TenantPwaBootstrap />")) {
  const bodyRegex = /<body([^>]*)>/;
  if (!bodyRegex.test(source)) {
    console.error("Balise <body> non trouvée dans layout.tsx.");
    process.exit(1);
  }
  source = source.replace(bodyRegex, "<body$1>\n        <TenantPwaBootstrap />");
}

if (source !== original) {
  const backup = `${layoutPath}.phase35a.bak`;
  if (!fs.existsSync(backup)) fs.copyFileSync(layoutPath, backup);
  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("layout.tsx configuré pour PWA tenant + mobile hardening.");
  console.log("Backup :", path.relative(ROOT, backup));
} else {
  console.log("layout.tsx déjà configuré.");
}
