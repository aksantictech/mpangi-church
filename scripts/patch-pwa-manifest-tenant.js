const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const publicManifestJson = path.join(ROOT, "public", "manifest.json");
const publicManifestWebmanifest = path.join(ROOT, "public", "manifest.webmanifest");
const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");
for (const filePath of [publicManifestJson, publicManifestWebmanifest]) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.bak`;
    if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);
    fs.rmSync(filePath);
    console.log("Supprimé manifest statique :", path.relative(ROOT, filePath));
  }
}
if (fs.existsSync(layoutPath)) {
  let source = fs.readFileSync(layoutPath, "utf8");
  const original = source;
  source = source.replace(/manifest:\s*["']\/manifest\.json["']/g, 'manifest: "/manifest.webmanifest"');
  source = source.replace(/href=["']\/manifest\.json["']/g, 'href="/manifest.webmanifest"');
  if (!source.includes('manifest: "/manifest.webmanifest"') && source.includes("export const metadata")) {
    source = source.replace(/export const metadata\s*=\s*\{/, 'export const metadata = {\n  manifest: "/manifest.webmanifest",');
  }
  if (source !== original) {
    const backupPath = `${layoutPath}.pwa-manifest.bak`;
    if (!fs.existsSync(backupPath)) fs.copyFileSync(layoutPath, backupPath);
    fs.writeFileSync(layoutPath, source, "utf8");
    console.log("Layout patché :", path.relative(ROOT, layoutPath));
  } else {
    console.log("Aucun patch nécessaire dans layout.tsx");
  }
}
