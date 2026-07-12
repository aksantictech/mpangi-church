const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const optional = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "NEXT_PUBLIC_APP_URL",
];

console.log("");
console.log("Mpangi-church — Audit variables environnement");
console.log("");

let failed = false;

for (const key of required) {
  const exists = Boolean(process.env[key]);
  console.log(`${exists ? "✅" : "❌"} ${key}${exists ? "" : " manquant"}`);
  if (!exists) failed = true;
}

console.log("");

for (const key of optional) {
  const exists = Boolean(process.env[key]);
  console.log(`${exists ? "✅" : "⚠️"} ${key}${exists ? "" : " non défini"}`);
}

if (failed) {
  console.log("");
  console.log("Variables obligatoires manquantes.");
  process.exit(1);
}

console.log("");
console.log("Variables obligatoires OK.");
