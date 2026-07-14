const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/styles/mobile-tables-lists.css",
  "src/components/mobile/MobileListsTablesEnhancer.tsx",
  "scripts/install-phase35d3.js",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.log("❌", relativePath);
  } else {
    console.log("✅", relativePath);
  }
}

const layoutPath = path.join(ROOT, "src/app/layout.tsx");

if (!fs.existsSync(layoutPath)) {
  failed = true;
  console.log("❌ src/app/layout.tsx");
} else {
  const source = fs.readFileSync(layoutPath, "utf8");

  const checks = [
    {
      label: "Import CSS tableaux/listes",
      ok: source.includes(
        "@/styles/mobile-tables-lists.css"
      ),
    },
    {
      label: "Import MobileListsTablesEnhancer",
      ok: source.includes(
        '@/components/mobile/MobileListsTablesEnhancer'
      ),
    },
    {
      label: "Montage MobileListsTablesEnhancer",
      ok:
        source.includes(
          "<MobileListsTablesEnhancer />"
        ) ||
        source.includes(
          "<MobileListsTablesEnhancer/>"
        ),
    },
  ];

  for (const check of checks) {
    console.log(check.ok ? "✅" : "❌", check.label);
    if (!check.ok) failed = true;
  }
}

if (failed) {
  console.log("");
  console.log("Phase 35D-3 incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35D-3 validée.");
