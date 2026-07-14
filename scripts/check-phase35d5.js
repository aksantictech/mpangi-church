const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/styles/mobile-performance-35d5.css",
  "src/components/mobile/MobilePerformanceCoordinator.tsx",
  "src/components/mobile/MobileRouteLoading.tsx",
  "src/app/mobile-maintenance/page.tsx",
  "scripts/audit-mobile-performance.js",
  "scripts/audit-public-assets.js",
  "scripts/audit-backup-files.js",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(ROOT, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    failed = true;
    console.log("❌", relativePath);
  }
}

const layoutPath = path.join(ROOT, "src/app/layout.tsx");

if (!fs.existsSync(layoutPath)) {
  failed = true;
  console.log("❌ src/app/layout.tsx");
} else {
  const source = fs.readFileSync(layoutPath, "utf8");

  const checks = [
    [
      "Import CSS Phase 35D-5",
      source.includes("@/styles/mobile-performance-35d5.css"),
    ],
    [
      "Import MobilePerformanceCoordinator",
      source.includes(
        "@/components/mobile/MobilePerformanceCoordinator"
      ),
    ],
    [
      "Montage MobilePerformanceCoordinator",
      source.includes("<MobilePerformanceCoordinator />"),
    ],
  ];

  for (const [label, ok] of checks) {
    console.log(ok ? "✅" : "❌", label);

    if (!ok) failed = true;
  }
}

if (failed) {
  console.log("");
  console.log("Phase 35D-5 incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35D-5 validée.");
