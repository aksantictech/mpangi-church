const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("layout.tsx introuvable :", layoutPath);
  process.exit(1);
}

let source = fs.readFileSync(layoutPath, "utf8");
const original = source;

if (!source.includes("@/components/pwa/ServiceWorkerRegister")) {
  source = `import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";\n` + source;
}

if (!source.includes("@/components/pwa/PwaInstallProvider")) {
  source = `import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";\n` + source;
}

source = source.replace(/manifest:\s*["']\/manifest\.json["']/g, 'manifest: "/manifest.webmanifest"');
source = source.replace(/href=["']\/manifest\.json["']/g, 'href="/manifest.webmanifest"');

if (!source.includes("<ServiceWorkerRegister />")) {
  source = source.replace(/<body([^>]*)>/, '<body$1>\n        <ServiceWorkerRegister />');
}

if (!source.includes("<PwaInstallProvider>")) {
  source = source.replace(/\{children\}/, "<PwaInstallProvider>{children}</PwaInstallProvider>");
}

if (source !== original) {
  const backupPath = `${layoutPath}.pwa-provider.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(layoutPath, backupPath);
  fs.writeFileSync(layoutPath, source, "utf8");
  console.log("layout.tsx patché.");
  console.log("Backup :", path.relative(ROOT, backupPath));
} else {
  console.log("layout.tsx déjà configuré.");
}
