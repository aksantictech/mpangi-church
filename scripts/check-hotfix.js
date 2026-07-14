const fs = require("fs");
const path = require("path");

const required = [
  "src/lib/users/createUserAccount.ts",
  "src/app/settings/users/new/actions.ts",
  "src/app/api/settings/users/new/actions.ts",
  "src/app/super-admin/users/new/actions.ts",
  "src/app/api/bible/versions/route.ts",
  "phase35b_profiles_accounts_security_hotfix.sql",
];

let failed = false;

for (const file of required) {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log("✅", file);
  } else {
    failed = true;
    console.log("❌", file);
  }
}

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");

  if (/^\s*(import|export)\s/m.test(env)) {
    failed = true;
    console.log("❌ .env.local contient du code TypeScript.");
  } else {
    console.log("✅ .env.local propre.");
  }
}

if (failed) process.exit(1);
console.log("✅ Hotfix validé.");
