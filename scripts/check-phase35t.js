const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "phase35t_users_and_donations.sql",
  "src/components/settings/ChurchUserProfileActions.tsx",
  "src/app/api/settings/users/[profileId]/route.ts",
  "src/app/settings/users/page.tsx",
  "src/components/donations/PublicDonationForm.tsx",
  "src/app/api/public/church-donations/route.ts",
  "src/app/settings/donations/page.tsx",
  "src/app/settings/donations/actions.ts",
  "src/app/church/[slug]/don/page.tsx",
  "src/app/church/[slug]/don/success/page.tsx",
  "src/lib/donations/constants.ts",
];

let failed = false;

for (const relativePath of required) {
  const fullPath = path.join(
    ROOT,
    relativePath
  );

  if (fs.existsSync(fullPath)) {
    console.log("✅", relativePath);
  } else {
    console.log("❌", relativePath);
    failed = true;
  }
}

const usersPage = path.join(
  ROOT,
  "src/app/settings/users/page.tsx"
);

if (fs.existsSync(usersPage)) {
  const source = fs.readFileSync(
    usersPage,
    "utf8"
  );

  const ok =
    source.includes(
      "ChurchUserProfileActions"
    ) &&
    source.includes("user_id");

  console.log(
    ok ? "✅" : "❌",
    "Gestion complète utilisateurs"
  );

  if (!ok) failed = true;
}

const donationPage = path.join(
  ROOT,
  "src/app/church/[slug]/don/page.tsx"
);

if (fs.existsSync(donationPage)) {
  const source = fs.readFileSync(
    donationPage,
    "utf8"
  );

  const ok =
    source.includes(
      "Proverbes 3:9-10"
    ) &&
    source.includes(
      "donation_mpesa_enabled"
    ) &&
    source.includes(
      "donation_airtel_enabled"
    ) &&
    source.includes(
      "donation_orange_enabled"
    );

  console.log(
    ok ? "✅" : "❌",
    "Page réelle de dons"
  );

  if (!ok) failed = true;
}

const globals = path.join(
  ROOT,
  "src/app/globals.css"
);

if (fs.existsSync(globals)) {
  const source = fs.readFileSync(
    globals,
    "utf8"
  );

  const ok = source.includes(
    ".mpangi-form-control"
  );

  console.log(
    ok ? "✅" : "❌",
    "Lisibilité des formulaires"
  );

  if (!ok) failed = true;
}

if (failed) {
  console.log("");
  console.log(
    "Phase 35T incomplète."
  );
  process.exit(1);
}

console.log("");
console.log(
  "✅ Phase 35T structurellement validée."
);
