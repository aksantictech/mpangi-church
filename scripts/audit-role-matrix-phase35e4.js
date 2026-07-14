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

const ROLE_ALIASES = {
  admin: "church_admin",
  pastor_titulaire: "pasteur_t",
  pasteur_titulaire: "pasteur_t",
  pastor_assistant: "pasteur_a",
  pasteur_assistant: "pasteur_a",
  secretary: "secretaire",
  department_leader: "responsable_d",
  viewer: "readonly",
};

const EXPECTED = {
  church_admin: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "public_requests",
    "users",
    "security",
  ],
  admin_eglise: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "public_requests",
    "users",
    "security",
  ],
  pasteur_t: [
    "role_dashboard",
    "my_work",
    "souls",
    "public_requests",
    "attendance",
  ],
  pastor: [
    "role_dashboard",
    "my_work",
    "souls",
    "public_requests",
  ],
  pasteur_a: [
    "role_dashboard",
    "my_work",
    "souls",
    "attendance",
  ],
  charge_afp: [
    "role_dashboard",
    "my_work",
    "finance_dashboard",
    "offerings",
    "expenses",
    "budgets",
    "donations",
  ],
  responsable_d: [
    "role_dashboard",
    "my_work",
    "members",
    "attendance",
    "departments",
    "events",
  ],
  logisticien: [
    "role_dashboard",
    "my_work",
    "patrimony",
    "assets",
    "maintenance",
    "movements",
  ],
  secretaire: [
    "role_dashboard",
    "my_work",
    "correspondence",
    "transmissions",
    "tasks",
    "minutes",
  ],
  worker: [
    "role_dashboard",
    "my_work",
    "attendance",
  ],
  readonly: ["role_dashboard"],
  member: [
    "role_dashboard",
    "my_work",
  ],
};

function normalizeRole(value) {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return ROLE_ALIASES[role] || role || "readonly";
}

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
      "Variables Supabase manquantes dans .env.local."
    );
  }

  const admin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [
    { data: churches, error: churchError },
    { data: profiles, error: profileError },
    { data: permissions, error: permissionError },
  ] = await Promise.all([
    admin
      .from("churches")
      .select("id, name, slug, status")
      .order("name"),
    admin
      .from("profiles")
      .select(
        "user_id, email, full_name, role, status, church_id"
      ),
    admin
      .from("church_role_module_permissions")
      .select(
        `
        church_id,
        role_code,
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete,
        can_approve,
        is_enabled
      `
      ),
  ]);

  const errors = [
    churchError,
    profileError,
    permissionError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(
      errors.map((item) => item.message).join(" | ")
    );
  }

  const churchRows = churches || [];
  const profileRows = profiles || [];
  const permissionRows = permissions || [];

  const findings = [];
  const matrix = [];

  for (const church of churchRows) {
    const churchProfiles = profileRows.filter(
      (item) => item.church_id === church.id
    );

    const churchPermissions = permissionRows.filter(
      (item) => item.church_id === church.id
    );

    const roleCodes = new Set([
      ...churchProfiles.map((item) =>
        normalizeRole(item.role)
      ),
      ...churchPermissions.map((item) =>
        String(item.role_code)
      ),
    ]);

    for (const roleCode of [...roleCodes].sort()) {
      const users = churchProfiles.filter(
        (item) =>
          normalizeRole(item.role) === roleCode
      );

      const permissionsForRole =
        churchPermissions.filter(
          (item) =>
            String(item.role_code) === roleCode
        );

      const viewModules = permissionsForRole
        .filter(
          (item) =>
            item.is_enabled && item.can_view
        )
        .map((item) => String(item.module_code));

      const missing = (
        EXPECTED[roleCode] || []
      ).filter(
        (moduleCode) =>
          !viewModules.includes(moduleCode)
      );

      const duplicateModules = [
        ...new Set(
          permissionsForRole
            .map((item) => String(item.module_code))
            .filter(
              (moduleCode, index, array) =>
                array.indexOf(moduleCode) !== index
            )
        ),
      ];

      if (
        roleCode !== "super_admin" &&
        permissionsForRole.length === 0
      ) {
        findings.push({
          severity: "critical",
          code: "ROLE_WITHOUT_PERMISSIONS",
          church: church.name,
          role: roleCode,
        });
      }

      if (
        roleCode !== "super_admin" &&
        viewModules.length === 0
      ) {
        findings.push({
          severity: "critical",
          code: "ROLE_WITHOUT_VISIBLE_MODULE",
          church: church.name,
          role: roleCode,
        });
      }

      if (missing.length > 0) {
        findings.push({
          severity: "warning",
          code: "BASELINE_MODULE_MISSING",
          church: church.name,
          role: roleCode,
          modules: missing,
        });
      }

      if (duplicateModules.length > 0) {
        findings.push({
          severity: "high",
          code: "DUPLICATE_PERMISSION_MODULE",
          church: church.name,
          role: roleCode,
          modules: duplicateModules,
        });
      }

      matrix.push({
        churchId: church.id,
        churchName: church.name,
        churchSlug: church.slug,
        roleCode,
        usersCount: users.length,
        permissionsCount:
          permissionsForRole.length,
        viewModules,
        createModules: permissionsForRole
          .filter(
            (item) =>
              item.is_enabled &&
              item.can_create
          )
          .map((item) => item.module_code),
        updateModules: permissionsForRole
          .filter(
            (item) =>
              item.is_enabled &&
              item.can_update
          )
          .map((item) => item.module_code),
        deleteModules: permissionsForRole
          .filter(
            (item) =>
              item.is_enabled &&
              item.can_delete
          )
          .map((item) => item.module_code),
        approveModules: permissionsForRole
          .filter(
            (item) =>
              item.is_enabled &&
              item.can_approve
          )
          .map((item) => item.module_code),
        missingBaseline: missing,
      });
    }
  }

  const summary = {
    churches: churchRows.length,
    profiles: profileRows.length,
    matrixRows: matrix.length,
    findings: findings.length,
    critical: findings.filter(
      (item) => item.severity === "critical"
    ).length,
    high: findings.filter(
      (item) => item.severity === "high"
    ).length,
    warning: findings.filter(
      (item) => item.severity === "warning"
    ).length,
  };

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "phase35e4-role-matrix-audit.json"
    ),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary,
        matrix,
        findings,
      },
      null,
      2
    ),
    "utf8"
  );

  const markdown = [
    "# Audit de la matrice des rôles — Phase 35E-4",
    "",
    `Églises : ${summary.churches}`,
    `Profils : ${summary.profiles}`,
    `Lignes de matrice : ${summary.matrixRows}`,
    `Anomalies critiques : ${summary.critical}`,
    `Anomalies élevées : ${summary.high}`,
    `Avertissements : ${summary.warning}`,
    "",
    "## Matrice",
    "",
    "| Église | Rôle | Comptes | Voir | Créer | Modifier | Supprimer | Valider |",
    "|---|---|---:|---:|---:|---:|---:|---:|",
    ...matrix.map(
      (row) =>
        `| ${row.churchName} | ${row.roleCode} | ${row.usersCount} | ${row.viewModules.length} | ${row.createModules.length} | ${row.updateModules.length} | ${row.deleteModules.length} | ${row.approveModules.length} |`
    ),
    "",
    "## Anomalies",
    "",
    ...(findings.length
      ? findings.map(
          (item) =>
            `- **${item.severity}** — ${item.code} — ${item.church} — ${item.role}${item.modules ? ` — ${item.modules.join(", ")}` : ""}`
        )
      : ["- Aucune"]),
  ];

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "PHASE35E4_ROLE_MATRIX_AUDIT.md"
    ),
    markdown.join("\n"),
    "utf8"
  );

  console.table(summary);
  console.log(
    "Rapport : PHASE35E4_ROLE_MATRIX_AUDIT.md"
  );

  if (summary.critical > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
