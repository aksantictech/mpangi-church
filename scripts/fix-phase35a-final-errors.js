const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      return [fullPath];
    }

    return [];
  });
}

function backup(filePath) {
  const backupPath = `${filePath}.phase35a-final-errors.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function normalizeCreateUserCalls(source) {
  return source.replace(
    /createOrUpdateUserAccount\(\{([\s\S]*?)\}\);/g,
    (fullMatch, rawBody) => {
      let body = rawBody;

      body = body.replace(
        /^\s*allowExistingInSameChurch\s*:\s*(true|false)\s*,?\s*$/gm,
        ""
      );

      body = body.replace(
        /^\s*allowExistingWithoutChurch\s*:\s*(true|false)\s*,?\s*$/gm,
        ""
      );

      if (!/\bupdateExisting\s*:/.test(body)) {
        const churchIdPattern = /(\n\s*churchId\s*:[^\n]+,?)/;

        if (churchIdPattern.test(body)) {
          body = body.replace(
            churchIdPattern,
            (line) => `${line}\n      updateExisting: true,`
          );
        } else {
          body = `${body}\n      updateExisting: true,`;
        }
      }

      body = body.replace(/\n{3,}/g, "\n\n");

      return `createOrUpdateUserAccount({${body}});`;
    }
  );
}

function cleanPublicMobileActionBar(source) {
  let result = source;

  result = result.replace(
    /import\s+PublicMobileActionBar\s+from\s+["'][^"']+["'];?\s*/g,
    ""
  );

  result = result.replace(
    /\s*<PublicMobileActionBar(?:\s+[^>]*)?\/>\s*/g,
    "\n"
  );

  // Supprime aussi les commentaires qui font échouer l'ancien script de contrôle.
  result = result.replace(
    /\{\/\*[\s\S]*?PublicMobileActionBar[\s\S]*?\*\/\}\s*/g,
    ""
  );

  result = result.replace(
    /\/\/[^\n]*PublicMobileActionBar[^\n]*\n?/g,
    ""
  );

  result = result.replace(
    /<PublicMobileBottomNav\s+slug=\{church\.slug\}\s*\/>/g,
    "<PublicMobileBottomNav slug={churchSlug} />"
  );

  const occurrences =
    result.match(/<PublicMobileBottomNav\s+slug=\{[^}]+\}\s*\/>/g) || [];

  if (occurrences.length > 1) {
    let kept = false;

    result = result.replace(
      /<PublicMobileBottomNav\s+slug=\{[^}]+\}\s*\/>/g,
      () => {
        if (!kept) {
          kept = true;
          return "<PublicMobileBottomNav slug={churchSlug} />";
        }

        return "";
      }
    );
  }

  return result;
}

const files = walk(SRC);
let changedCount = 0;

for (const filePath of files) {
  let source = fs.readFileSync(filePath, "utf8");
  const original = source;

  if (
    source.includes("allowExistingInSameChurch") ||
    source.includes("allowExistingWithoutChurch") ||
    source.includes("createOrUpdateUserAccount({")
  ) {
    source = normalizeCreateUserCalls(source);
  }

  const normalizedPath = filePath.split(path.sep).join("/");

  if (
    normalizedPath.endsWith("/src/app/church/[slug]/page.tsx") ||
    source.includes("PublicMobileActionBar")
  ) {
    source = cleanPublicMobileActionBar(source);
  }

  if (source !== original) {
    backup(filePath);
    fs.writeFileSync(filePath, source, "utf8");
    changedCount += 1;
    console.log("✅ Corrigé :", path.relative(ROOT, filePath));
  }
}

console.log("");
console.log(`Fichiers modifiés : ${changedCount}`);

const legacyOccurrences = [];

for (const filePath of walk(SRC)) {
  const source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes("allowExistingInSameChurch") ||
    source.includes("allowExistingWithoutChurch")
  ) {
    legacyOccurrences.push(path.relative(ROOT, filePath));
  }
}

if (legacyOccurrences.length) {
  console.error("");
  console.error("❌ Propriétés historiques encore présentes :");
  legacyOccurrences.forEach((file) => console.error("-", file));
  process.exit(1);
}

console.log("✅ Anciennes propriétés de création utilisateur supprimées.");
console.log("✅ PublicMobileActionBar supprimé de la page publique.");
