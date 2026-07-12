const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const pagePath = path.join(ROOT, "src", "app", "church", "[slug]", "page.tsx");

if (!fs.existsSync(pagePath)) {
  console.error("Fichier public église introuvable :", pagePath);
  process.exit(1);
}

let source = fs.readFileSync(pagePath, "utf8");
const original = source;

if (!source.includes("@/components/public/bible/PublicBibleBlock")) {
  const lastImportMatch = [...source.matchAll(/^import .*?;$/gm)].pop();

  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length;
    source =
      source.slice(0, insertAt) +
      '\nimport PublicBibleBlock from "@/components/public/bible/PublicBibleBlock";' +
      source.slice(insertAt);
  } else {
    source = 'import PublicBibleBlock from "@/components/public/bible/PublicBibleBlock";\n' + source;
  }
}

if (!source.includes("<PublicBibleBlock")) {
  const block = `\n\n      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">\n        <PublicBibleBlock slug={church.slug} />\n      </section>\n`;

  const insertionPoints = [
    "<ChurchTeachingsBlock",
    "<PublicTeachingsSection",
    "<PublicLiveStreamSection",
    "<PublicProgramsSection",
  ];

  let inserted = false;

  for (const marker of insertionPoints) {
    const idx = source.indexOf(marker);
    if (idx === -1) continue;

    const sectionStart = source.lastIndexOf("<section", idx);
    const sectionEnd = source.indexOf("</section>", idx);

    if (sectionEnd !== -1) {
      const insertAt = sectionEnd + "</section>".length;
      source = source.slice(0, insertAt) + block + source.slice(insertAt);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    const mainEnd = source.lastIndexOf("</main>");
    if (mainEnd !== -1) {
      source = source.slice(0, mainEnd) + block + source.slice(mainEnd);
      inserted = true;
    }
  }

  if (!inserted) {
    console.log("Insertion automatique impossible.");
    console.log("Ajoute manuellement : <PublicBibleBlock slug={church.slug} />");
  }
}

if (source !== original) {
  const backupPath = `${pagePath}.bible-v2.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(pagePath, backupPath);
  fs.writeFileSync(pagePath, source, "utf8");
  console.log("Page publique patchée :", path.relative(ROOT, pagePath));
} else {
  console.log("Aucune modification nécessaire.");
}
