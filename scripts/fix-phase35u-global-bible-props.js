const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const filePath = path.join(
  ROOT,
  "src/app/bible/page.tsx"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ Fichier introuvable : src/app/bible/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");

const backupPath =
  `${filePath}.phase35u-global-bible.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
}

const oldCall = "<BibleReaderClient />";

const newCall = `<BibleReaderClient
        churchSlug="mpangi-church"
        churchName="Mpangi-Church"
      />`;

if (source.includes(newCall)) {
  console.log("ℹ️ Correctif Bible globale déjà appliqué.");
  process.exit(0);
}

if (!source.includes(oldCall)) {
  console.error(
    "❌ Appel <BibleReaderClient /> non trouvé. " +
    "Ouvre src/app/bible/page.tsx et applique le correctif manuel du README."
  );
  process.exit(1);
}

source = source.replace(oldCall, newCall);

fs.writeFileSync(filePath, source, "utf8");

console.log("✅ Props Bible globale ajoutées.");
console.log("   churchSlug : mpangi-church");
console.log("   churchName : Mpangi-Church");
