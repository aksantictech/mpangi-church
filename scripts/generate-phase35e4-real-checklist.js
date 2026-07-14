const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};

  for (const line of fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)) {
    const match = line.match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/
    );

    if (!match) continue;

    values[match[1]] = match[2]
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return values;
}

const TESTS_BY_ROLE = {
  super_admin: [
    "Ouvrir /super-admin/churches",
    "Ouvrir /super-admin/users",
    "Ouvrir /settings/security-audit",
    "Vérifier la consultation de plusieurs églises",
  ],
  church_admin: [
    "Ouvrir /members",
    "Ouvrir /settings/users",
    "Ouvrir /settings/roles",
    "Ouvrir /settings/security-validation",
    "Vérifier que les données appartiennent à son église",
  ],
  admin_eglise: [
    "Ouvrir /members",
    "Ouvrir /settings/users",
    "Ouvrir /settings/roles",
    "Vérifier que les données appartiennent à son église",
  ],
  pasteur_t: [
    "Ouvrir /souls",
    "Ouvrir /public-requests",
    "Ouvrir /attendance",
    "Vérifier les actions de validation configurées",
  ],
  pastor: [
    "Ouvrir /souls",
    "Ouvrir /public-requests",
    "Vérifier les modules interdits",
  ],
  pasteur_a: [
    "Ouvrir /souls",
    "Ouvrir /my-work",
    "Confirmer que /settings/roles est refusé",
  ],
  charge_afp: [
    "Ouvrir /finance",
    "Ouvrir /finance/donations",
    "Ouvrir /finance/budgets",
    "Confirmer que /settings/roles est refusé",
  ],
  responsable_d: [
    "Ouvrir /departments",
    "Ouvrir /members",
    "Ouvrir /attendance",
    "Confirmer que /finance est refusé",
  ],
  logisticien: [
    "Ouvrir /patrimony",
    "Ouvrir /patrimony/assets",
    "Ouvrir /patrimony/maintenance",
    "Confirmer que /finance est refusé",
  ],
  secretaire: [
    "Ouvrir /administration/correspondence",
    "Ouvrir /administration/transmissions",
    "Ouvrir /administration/minutes",
    "Confirmer que /settings/roles est refusé",
  ],
  worker: [
    "Ouvrir /my-work",
    "Ouvrir /attendance",
    "Confirmer que les modules administratifs sont refusés",
  ],
  readonly: [
    "Ouvrir les pages autorisées",
    "Tenter une création",
    "Tenter une modification",
    "Tenter une suppression",
    "Confirmer que toutes les mutations sont refusées",
  ],
  member: [
    "Ouvrir /dashboard/role",
    "Ouvrir /my-work",
    "Ouvrir /teachings si autorisé",
    "Confirmer que Finances et Paramètres sont refusés",
  ],
};

async function main() {
  const env = readEnv(
    path.join(process.cwd(), ".env.local")
  );

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variables Supabase manquantes."
    );
  }

  const admin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await admin
    .from("profiles")
    .select(
      `
      user_id,
      email,
      full_name,
      role,
      status,
      church_id,
      churches (
        name,
        slug
      )
    `
    )
    .not("user_id", "is", null)
    .order("role");

  if (error) throw error;

  const profiles = data || [];

  const lines = [
    "# Checklist réelle — Phase 35E-4",
    "",
    "Marquer chaque test avec `[x]` après validation.",
    "",
  ];

  for (const profile of profiles) {
    const church = Array.isArray(profile.churches)
      ? profile.churches[0]
      : profile.churches;

    const role = String(profile.role || "readonly");

    lines.push(
      `## ${profile.email || profile.full_name || profile.user_id}`
    );
    lines.push("");
    lines.push(`- Rôle : \`${role}\``);
    lines.push(
      `- Église : ${church?.name || profile.church_id || "Aucune"}`
    );
    lines.push(
      `- Statut : ${profile.status || "-"}`
    );
    lines.push("");

    const tests =
      TESTS_BY_ROLE[role] || [
        "Ouvrir /modules",
        "Vérifier les liens visibles",
        "Tenter une route interdite",
        "Vérifier la redirection /unauthorized",
      ];

    for (const test of tests) {
      lines.push(`- [ ] ${test}`);
    }

    lines.push(
      "- [ ] Vérifier qu’aucune donnée d’une autre église n’est visible"
    );
    lines.push(
      "- [ ] Vérifier le journal après un refus"
    );
    lines.push("");
  }

  lines.push("## Test croisé obligatoire");
  lines.push("");
  lines.push(
    "- [ ] Choisir un compte de l’église A et un identifiant de donnée appartenant à l’église B"
  );
  lines.push(
    "- [ ] Tester lecture, modification et téléchargement"
  );
  lines.push(
    "- [ ] Confirmer : aucune ligne retournée ou accès refusé"
  );
  lines.push(
    "- [ ] Vérifier l’événement dans `/settings/security-audit`"
  );

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "PHASE35E4_REAL_CHECKLIST.md"
    ),
    lines.join("\n"),
    "utf8"
  );

  console.log(
    "Checklist créée : PHASE35E4_REAL_CHECKLIST.md"
  );
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
