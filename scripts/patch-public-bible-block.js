const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const pagePath = path.join(ROOT, "src", "app", "church", "[slug]", "page.tsx");
if (!fs.existsSync(pagePath)) { console.error("Fichier public église introuvable :", pagePath); process.exit(1); }
let source = fs.readFileSync(pagePath, "utf8");
const original = source;
if (!source.includes("@/components/public/bible/PublicBibleBlock")) source = source.replace(/(import .*?;\n)/, `$1import PublicBibleBlock from "@/components/public/bible/PublicBibleBlock";\n`);
if (!source.includes("<PublicBibleBlock")) {
  if (source.includes("<ChurchTeachingsBlock")) source = source.replace(/(<ChurchTeachingsBlock[\s\S]*?\/>(?:\s*<\/section>)?)/, `$1\n\n      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">\n        <PublicBibleBlock slug={churchSlug} />\n      </section>`);
  else if (source.includes("<PublicLiveStreamSection")) source = source.replace(/(<PublicLiveStreamSection[\s\S]*?\/>)/, `$1\n\n      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">\n        <PublicBibleBlock slug={churchSlug} />\n      </section>`);
  else console.warn("Point d'insertion automatique non trouvé. Ajoute manuellement <PublicBibleBlock slug={churchSlug} />");
}
if (source !== original) { const backupPath = `${pagePath}.bible-block.bak`; if (!fs.existsSync(backupPath)) fs.copyFileSync(pagePath, backupPath); fs.writeFileSync(pagePath, source, "utf8"); console.log("Page publique patchée :", path.relative(ROOT, pagePath)); } else console.log("Aucune modification nécessaire.");
