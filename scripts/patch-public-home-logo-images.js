const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const pagePath = path.join(ROOT, "src", "app", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("src/app/page.tsx introuvable.");
  process.exit(1);
}

let source = fs.readFileSync(pagePath, "utf8");
const original = source;

if (!source.includes("@/components/public/PublicBrandLogo")) {
  const imports = [...source.matchAll(/^import .*?;$/gm)];
  const lastImport = imports[imports.length - 1];

  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    source =
      source.slice(0, insertAt) +
      '\nimport PublicBrandLogo from "@/components/public/PublicBrandLogo";' +
      source.slice(insertAt);
  } else {
    source =
      'import PublicBrandLogo from "@/components/public/PublicBrandLogo";\n' +
      source;
  }
}

source = source.replace(
  /const MPANGI_LOGO_SRC = .*?;\n/g,
  'const MPANGI_LOGO_SRC = "/images/mpangi-logo.png?v=20260713";\n'
);

source = source.replace(
  /<img\s+src=\{MPANGI_LOGO_SRC\}\s+alt="Logo Mpangi-church"\s+className="h-12 w-12 rounded-2xl object-contain"\s+\/>/,
  '<PublicBrandLogo className="h-12 w-12 rounded-2xl object-contain" />'
);

// Fallback plus tolérant si le format est différent.
source = source.replace(
  /<img\s+src=\{MPANGI_LOGO_SRC\}[\s\S]*?alt="Logo Mpangi-church"[\s\S]*?className="h-12 w-12 rounded-2xl object-contain"[\s\S]*?\/>/,
  '<PublicBrandLogo className="h-12 w-12 rounded-2xl object-contain" />'
);

if (source === original) {
  console.log("Aucune modification détectée. Le fichier est peut-être déjà corrigé.");
  process.exit(0);
}

const backupPath = `${pagePath}.logo-images-firefox.bak`;
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(pagePath, backupPath);
}

fs.writeFileSync(pagePath, source, "utf8");

console.log("Page publique corrigée.");
console.log("Logo primaire : /images/mpangi-logo.png?v=20260713");
console.log("Fallback      : /icons/icon-192.png?v=20260713");
console.log("Backup        :", path.relative(ROOT, backupPath));
