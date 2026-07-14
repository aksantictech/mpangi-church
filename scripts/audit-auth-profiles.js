const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);

    if (!match) continue;

    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }

  return values;
}

async function main() {
  const localEnv = readEnv(path.join(process.cwd(), ".env.local"));

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    localEnv.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    localEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante."
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (authError) throw authError;

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id, user_id, email, full_name, role, status, church_id"
    );

  if (profilesError) throw profilesError;

  // IMPORTANT : la liaison correcte est profiles.user_id -> auth.users.id.
  const profilesByUserId = new Map(
    (profiles || []).map((profile) => [profile.user_id, profile])
  );

  const rows = (authData.users || []).map((user) => {
    const profile = profilesByUserId.get(user.id);

    const role =
      profile?.role ||
      user.user_metadata?.role ||
      "-";

    const churchId =
      profile?.church_id ||
      user.user_metadata?.church_id ||
      "-";

    let diagnostic = "OK";

    if (!profile) {
      diagnostic = "PROFILE_MISSING";
    } else if (!profile.user_id) {
      diagnostic = "USER_ID_MISSING";
    } else if (!profile.church_id && role !== "super_admin") {
      diagnostic = "CHURCH_MISSING";
    }

    return {
      email: user.email,
      profile: Boolean(profile),
      profile_id: profile?.id || "-",
      user_id: profile?.user_id || "-",
      role,
      church_id: churchId,
      diagnostic,
    };
  });

  console.table(rows);

  const failures = rows.filter(
    (row) => row.diagnostic !== "OK"
  );

  console.log("");
  console.log(`Comptes contrôlés : ${rows.length}`);
  console.log(`Comptes à corriger : ${failures.length}`);
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
