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

const KNOWN_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "pasteur_a",
  "charge_afp",
  "responsable_d",
  "logisticien",
  "secretaire",
  "worker",
  "readonly",
  "member",
]);

async function main() {
  const env = readEnv(path.join(process.cwd(), ".env.local"));

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante."
    );
  }

  const admin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [
    { data: profiles, error: profilesError },
    { data: churches, error: churchesError },
    { data: permissions, error: permissionsError },
    { data: widgets, error: widgetsError },
    { data: templates, error: templatesError },
    { data: tasks, error: tasksError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, user_id, email, role, status, church_id"
      ),
    admin
      .from("churches")
      .select("id, name, slug, status"),
    admin
      .from("church_role_module_permissions")
      .select(
        "church_id, role_code, module_code, can_view, is_enabled"
      ),
    admin
      .from("church_role_dashboard_widgets")
      .select(
        "church_id, role_code, widget_code, is_enabled"
      ),
    admin
      .from("church_role_task_templates")
      .select(
        "church_id, role_code, title, is_active"
      ),
    admin
      .from("church_user_role_tasks")
      .select(
        "id, church_id, assigned_to, title, status"
      ),
  ]);

  const errors = [
    profilesError,
    churchesError,
    permissionsError,
    widgetsError,
    templatesError,
    tasksError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(
      errors.map((error) => error.message).join(" | ")
    );
  }

  const churchIds = new Set(
    (churches || []).map((church) => church.id)
  );

  const profileIssues = (profiles || [])
    .map((profile) => {
      const role = String(profile.role || "");

      let diagnostic = "OK";

      if (!profile.user_id) {
        diagnostic = "USER_ID_MISSING";
      } else if (!KNOWN_ROLES.has(role)) {
        diagnostic = "UNKNOWN_ROLE";
      } else if (
        role !== "super_admin" &&
        !profile.church_id
      ) {
        diagnostic = "CHURCH_MISSING";
      } else if (
        profile.church_id &&
        !churchIds.has(profile.church_id)
      ) {
        diagnostic = "CHURCH_INVALID";
      }

      return {
        email: profile.email,
        role,
        church_id: profile.church_id || "-",
        diagnostic,
      };
    })
    .filter((row) => row.diagnostic !== "OK");

  const permissionSummary = (churches || []).map(
    (church) => {
      const churchPermissions = (permissions || []).filter(
        (permission) =>
          permission.church_id === church.id
      );

      return {
        church: church.name,
        roles: new Set(
          churchPermissions.map(
            (permission) => permission.role_code
          )
        ).size,
        permissions: churchPermissions.length,
        widgets: (widgets || []).filter(
          (widget) => widget.church_id === church.id
        ).length,
        templates: (templates || []).filter(
          (template) => template.church_id === church.id
        ).length,
      };
    }
  );

  const taskIssues = (tasks || []).filter(
    (task) => !churchIds.has(task.church_id)
  );

  const report = {
    generatedAt: new Date().toISOString(),
    churches: churches || [],
    profileIssues,
    permissionSummary,
    taskIssues,
  };

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "phase35e-security-audit.json"
    ),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  const lines = [
    "# Audit sécurité Phase 35E",
    "",
    `Églises : ${(churches || []).length}`,
    `Profils à corriger : ${profileIssues.length}`,
    `Tâches incohérentes : ${taskIssues.length}`,
    "",
    "## Synthèse par église",
    "",
    "| Église | Rôles | Permissions | Widgets | Modèles de tâches |",
    "|---|---:|---:|---:|---:|",
    ...permissionSummary.map(
      (row) =>
        `| ${row.church} | ${row.roles} | ${row.permissions} | ${row.widgets} | ${row.templates} |`
    ),
    "",
    "## Profils à corriger",
    "",
    ...(profileIssues.length
      ? profileIssues.map(
          (row) =>
            `- ${row.email} — ${row.diagnostic} — ${row.role}`
        )
      : ["- Aucun"]),
  ];

  fs.writeFileSync(
    path.join(
      process.cwd(),
      "PHASE35E_SECURITY_AUDIT.md"
    ),
    lines.join("\n"),
    "utf8"
  );

  console.table(permissionSummary);
  console.log("");
  console.log("Profils à corriger :", profileIssues.length);
  console.log("Tâches incohérentes :", taskIssues.length);
  console.log("Rapport : PHASE35E_SECURITY_AUDIT.md");
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
