const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "BIBLE_API_KEY",
  "BIBLE_DEFAULT_VERSION_ID",
  "BIBLE_ALLOWED_VERSION_IDS",
];

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(
    envPath,
    requiredKeys.map((key) => `${key}=`).join("\n") + "\n"
  );
  console.log("✅ .env.local créé.");
  process.exit(0);
}

const original = fs.readFileSync(envPath, "utf8");
const backupPath = `${envPath}.before-env-repair.bak`;

if (!fs.existsSync(backupPath)) fs.copyFileSync(envPath, backupPath);

const kept = [];
const existingKeys = new Set();
let removed = 0;

for (const line of original.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    kept.push(line);
    continue;
  }

  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);

  if (match) {
    existingKeys.add(match[1]);
    kept.push(`${match[1]}=${match[2]}`);
  } else {
    removed += 1;
  }
}

for (const key of requiredKeys) {
  if (!existingKeys.has(key)) kept.push(`${key}=`);
}

fs.writeFileSync(
  envPath,
  kept.join("\n").replace(/\n{3,}/g, "\n\n") + "\n"
);

console.log("✅ .env.local nettoyé.");
console.log("Backup :", path.basename(backupPath));
console.log("Lignes invalides retirées :", removed);
