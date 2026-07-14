const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const required = [
  ".env.backup.example",
  "backups/.gitignore",
  "scripts/backup/env-loader.js",
  "scripts/backup/run-backup.ps1",
  "scripts/backup/backup-storage.js",
  "scripts/backup/create-manifest.js",
  "scripts/backup/verify-backup.js",
  "scripts/backup/apply-retention.js",
  "scripts/backup/restore-database.ps1",
  "scripts/backup/register-windows-task.ps1",
  ".github/workflows/mpangi-backup.yml",
  "docs/PHASE35F_BACKUP_POLICY.md",
  "docs/PHASE35F_RESTORE_RUNBOOK.md",
];

let failed = false;

for (const relativePath of required) {
  const filePath = path.join(ROOT, relativePath);
  const exists = fs.existsSync(filePath);
  console.log(exists ? "✅" : "❌", relativePath);
  if (!exists) failed = true;
}

if (failed) {
  console.log("\nPhase 35F incomplète.");
  process.exit(1);
}

console.log("\n✅ Phase 35F validée.");
