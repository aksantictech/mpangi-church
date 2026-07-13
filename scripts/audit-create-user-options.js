const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(fullPath);

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      return [fullPath];
    }

    return [];
  });
}

const matches = [];

for (const filePath of walk(path.join(ROOT, "src"))) {
  const source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes("allowExistingInSameChurch") ||
    source.includes("allowExistingWithoutChurch")
  ) {
    matches.push(path.relative(ROOT, filePath));
  }
}

if (matches.length) {
  console.log("Anciennes options détectées :");
  matches.forEach((file) => console.log("-", file));
  process.exit(1);
}

console.log("✅ Aucune ancienne option createUserAccount détectée.");
