const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "phase35c_donations_complete.sql",
  "src/lib/donations/constants.ts",
  "src/app/api/public/church-donations/route.ts",
  "src/components/donations/PublicDonationForm.tsx",
  "src/app/church/[slug]/don/page.tsx",
  "src/app/church/[slug]/don/success/page.tsx",
  "src/components/public/PublicDonationSection.tsx",
  "src/app/settings/donations/actions.ts",
  "src/app/settings/donations/page.tsx",
  "src/app/finance/donations/actions.ts",
  "src/app/finance/donations/page.tsx",
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

const registryPath = path.join(
  ROOT,
  "src/lib/modules/moduleRegistry.ts"
);

if (fs.existsSync(registryPath)) {
  const source = fs.readFileSync(registryPath, "utf8");

  if (!source.includes('href: "/finance/donations"')) {
    console.log(
      "⚠️ Menu Dons reçus absent de moduleRegistry.ts."
    );
  }
}

if (failed) {
  console.log("");
  console.log("Phase 35C incomplète.");
  process.exit(1);
}

console.log("");
console.log("✅ Phase 35C validée.");
