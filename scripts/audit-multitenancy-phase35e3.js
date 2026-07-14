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

async function safeSelect(admin, table, columns) {
  const { data, error } = await admin.from(table).select(columns);
  return { table, data: data || [], error: error?.message || null };
}

async function main() {
  const env = readEnv(path.join(process.cwd(), ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Variables Supabase manquantes.");

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = await Promise.all([
    safeSelect(admin, "churches", "id,name,slug,status"),
    safeSelect(admin, "profiles", "id,user_id,email,role,status,church_id"),
    safeSelect(admin, "church_role_module_permissions", "id,church_id,role_code,module_code"),
    safeSelect(admin, "church_user_role_tasks", "id,church_id,assigned_to,status,title"),
    safeSelect(admin, "security_audit_logs", "id,church_id,actor_user_id,status,severity,created_at"),
  ]);

  const tables = Object.fromEntries(results.map((item) => [item.table, item]));
  const churches = tables.churches.data;
  const profiles = tables.profiles.data;
  const permissions = tables.church_role_module_permissions.data;
  const tasks = tables.church_user_role_tasks.data;
  const churchIds = new Set(churches.map((item) => item.id));
  const profileByUser = new Map(profiles.filter((p) => p.user_id).map((p) => [p.user_id, p]));
  const findings = [];

  for (const profile of profiles) {
    if (!profile.user_id) findings.push({ severity: "critical", code: "PROFILE_USER_ID_MISSING", entity: profile.email || profile.id });
    if (String(profile.role) !== "super_admin" && !profile.church_id) findings.push({ severity: "high", code: "PROFILE_CHURCH_MISSING", entity: profile.email || profile.id });
    if (profile.church_id && !churchIds.has(profile.church_id)) findings.push({ severity: "critical", code: "PROFILE_CHURCH_INVALID", entity: profile.email || profile.id });
  }

  for (const permission of permissions) {
    if (!churchIds.has(permission.church_id)) findings.push({ severity: "critical", code: "PERMISSION_CHURCH_INVALID", entity: permission.id });
  }

  for (const task of tasks) {
    const profile = profileByUser.get(task.assigned_to);
    if (!profile) {
      findings.push({ severity: "critical", code: "TASK_PROFILE_MISSING", entity: task.id });
    } else if (profile.church_id !== task.church_id) {
      findings.push({ severity: "critical", code: "TASK_CROSS_CHURCH", entity: task.id });
    }
  }

  const summary = {
    churches: churches.length,
    profiles: profiles.length,
    permissions: permissions.length,
    tasks: tasks.length,
    auditLogs: tables.security_audit_logs.data.length,
    findings: findings.length,
    tableErrors: results.filter((r) => r.error).length,
  };

  fs.writeFileSync(
    path.join(process.cwd(), "phase35e3-multitenancy-audit.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings, errors: results.filter((r) => r.error) }, null, 2),
    "utf8"
  );

  const lines = [
    "# Audit multi-église Phase 35E-3",
    "",
    `Églises : ${summary.churches}`,
    `Profils : ${summary.profiles}`,
    `Permissions : ${summary.permissions}`,
    `Tâches : ${summary.tasks}`,
    `Journaux : ${summary.auditLogs}`,
    `Anomalies : ${summary.findings}`,
    "",
    "## Anomalies",
    "",
    ...(findings.length ? findings.map((item) => `- **${item.severity}** — ${item.code} — ${item.entity}`) : ["- Aucune"]),
  ];

  fs.writeFileSync(path.join(process.cwd(), "PHASE35E3_MULTITENANCY_AUDIT.md"), lines.join("\n"), "utf8");
  console.table(summary);
  console.log("Rapport : PHASE35E3_MULTITENANCY_AUDIT.md");

  if (findings.some((item) => item.severity === "critical")) process.exitCode = 2;
}

main().catch((error) => {
  console.error("❌", error.message || error);
  process.exit(1);
});
