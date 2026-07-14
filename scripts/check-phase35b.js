const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const requiredFiles = [
  "src/lib/bible/apiBible.ts",
  "src/app/api/bible/versions/route.ts",
  "src/app/api/bible/books/route.ts",
  "src/app/api/bible/chapter/route.ts",
  "src/app/api/bible/search/route.ts",
  "src/components/bible/BibleFumsTracker.tsx",
  "src/components/bible/BibleReaderClient.tsx",
  "src/styles/bible-reader.css",
  "src/app/bible/page.tsx",
  "src/app/church/[slug]/bible/page.tsx",
  "src/components/public/bible/PublicBibleBlock.tsx",
];

let failed = false;

console.log("");
console.log("Contrôle Phase 35B — Bible");
console.log("");

for (const relativePath of requiredFiles) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log("❌", relativePath);
  } else {
    console.log("✅", relativePath);
  }
}

const layoutPath = path.join(ROOT, "src", "app", "layout.tsx");

if (fs.existsSync(layoutPath)) {
  const layout = fs.readFileSync(layoutPath, "utf8");

  if (!layout.includes("@/styles/bible-reader.css")) {
    failed = true;
    console.log("❌ bible-reader.css absent de layout.tsx.");
  }
}

const registryPath = path.join(
  ROOT,
  "src",
  "lib",
  "modules",
  "moduleRegistry.ts"
);

if (fs.existsSync(registryPath)) {
  const registry = fs.readFileSync(registryPath, "utf8");

  if (!registry.includes('code: "bible"')) {
    failed = true;
    console.log("❌ Menu Bible absent de moduleRegistry.ts.");
  }
}

console.log("");

if (failed) {
  console.log("Phase 35B incomplète.");
  process.exit(1);
}

console.log("✅ Phase 35B validée.");
console.log("");
console.log("Tests :");
console.log("- /bible");
console.log("- /church/<slug>/bible");
console.log("- /api/bible/versions");
console.log("- /api/bible/books?bibleId=...");
