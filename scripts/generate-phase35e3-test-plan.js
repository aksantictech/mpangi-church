const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

async function main() {
  const env = readEnv(path.join(process.cwd(), ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes.");

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin
    .from("profiles")
    .select("user_id,email,full_name,role,status,church_id,churches(name,slug)")
    .not("user_id", "is", null)
    .order("role");

  if (error) throw error;

  const rows = data || [];
  const byRole = new Map();

  for (const profile of rows) {
    const role = String(profile.role || "unknown");
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role).push(profile);
  }

  const lines = ["# Plan de tests réel Phase 35E-3", "", "## Comptes par rôle", ""];

  for (const [role, profiles] of byRole.entries()) {
    lines.push(`### ${role}`, "");
    for (const profile of profiles) {
      const church = Array.isArray(profile.churches) ? profile.churches[0] : profile.churches;
      lines.push(`- ${profile.email || profile.full_name || profile.user_id} — ${church?.name || "Sans église"} — ${profile.status || "-"}`);
    }
    lines.push("");
  }

  lines.push(
    "## Scénarios obligatoires",
    "",
    "- Chargé AFP : Finances autorisées, Sécurité refusée.",
    "- Logisticien : Patrimoine autorisé, Finances refusées.",
    "- Secrétaire : Administration autorisée.",
    "- Lecture seule : aucune mutation autorisée.",
    "- Compte A : aucune donnée de l’église B.",
    "- Accès refusé : ligne visible dans /settings/security-audit."
  );

  fs.writeFileSync(path.join(process.cwd(), "PHASE35E3_REAL_TEST_PLAN.md"), lines.join("\n"), "utf8");
  console.log("Plan créé : PHASE35E3_REAL_TEST_PLAN.md");
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
