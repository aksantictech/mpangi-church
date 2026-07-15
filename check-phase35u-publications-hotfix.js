const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "phase35u_publications_schema_alignment.sql",
  "src/app/api/publications/route.ts",
  "src/components/publications/PublicationForm.tsx",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(ROOT, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    console.log("❌", relativePath);
    failed = true;
  }
}

const routePath = path.join(
  ROOT,
  "src/app/api/publications/route.ts"
);

if (fs.existsSync(routePath)) {
  const source = fs.readFileSync(routePath, "utf8");

  const expectedColumns = [
    "description",
    "content",
    "publication_type",
    "video_url",
    "video_embed_url",
    "is_published",
    "is_featured",
    "published_at",
    "created_by",
  ];

  const missing = expectedColumns.filter(
    (column) => !source.includes(column)
  );

  if (missing.length === 0) {
    console.log("✅ Contrat API publications détecté");
  } else {
    console.log(
      "❌ Contrat incomplet :",
      missing.join(", ")
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("");
console.log("✅ Hotfix publications prêt.");
