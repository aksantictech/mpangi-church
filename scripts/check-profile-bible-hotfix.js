const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const required = [
  "src/lib/users/createUserAccount.ts",
  "src/lib/bible/apiBible.ts",
  "fix_profiles_real_schema.sql",
  "scripts/audit-auth-profiles.js",
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

const createUserPath = path.join(
  ROOT,
  "src/lib/users/createUserAccount.ts"
);

if (fs.existsSync(createUserPath)) {
  const source = fs.readFileSync(createUserPath, "utf8");

  if (source.includes("id: authUser.id,\n      user_id: authUser.id")) {
    failed = true;
    console.log(
      "❌ createUserAccount renseigne encore profiles.id avec authUser.id."
    );
  }

  if (!source.includes(".eq(\"user_id\", authUserId)")) {
    failed = true;
    console.log(
      "❌ La recherche du profil n'utilise pas profiles.user_id."
    );
  }
}

if (failed) process.exit(1);

console.log("");
console.log("✅ Correctif profils + module Bible validé.");
