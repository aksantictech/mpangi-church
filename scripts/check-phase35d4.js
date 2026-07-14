const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/styles/mobile-experience-35d4.css",
  "src/components/mobile/MobileRouteExperienceEnhancer.tsx",
  "src/components/pwa/PwaInstallCoordinator.tsx",
  "src/components/pwa/PwaInstallButtonPro.tsx",
  "src/app/install/page.tsx",
  "public/sw.js",
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
      "Import CSS Phase 35D-4",
      source.includes("@/styles/mobile-experience-35d4.css"),
    ],
    [
      "Import MobileRouteExperienceEnhancer",
      source.includes(
        "@/components/mobile/MobileRouteExperienceEnhancer"
      ),
    ],
    [
      "Montage MobileRouteExperienceEnhancer",
      source.includes("<MobileRouteExperienceEnhancer />"),
    ],
    [
      "Import PwaInstallCoordinator",
      source.includes(
        "@/components/pwa/PwaInstallCoordinator"
      ),
    ],
    [
      "Montage PwaInstallCoordinator",
      source.includes("<PwaInstallCoordinator />"),
    ],
  ];

  for (const [label, ok] of checks) {
    console.log(ok ? "✅" : "❌", label);
    if (!ok) failed = true;
  }
}

if (failed) {
  console.log("");
  console.log("Phase 35D-4 incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35D-4 validée.");
