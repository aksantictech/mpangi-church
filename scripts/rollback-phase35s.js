const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BACKUP_ROOT = path.join(ROOT, ".phase35s-backup");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
}

const backups = walk(BACKUP_ROOT);

if (backups.length === 0) {
  console.error("❌ Aucune sauvegarde Phase 35S trouvée.");
  process.exit(1);
}

for (const backupFile of backups) {
  const relativePath = path.relative(BACKUP_ROOT, backupFile);
  const targetFile = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.copyFileSync(backupFile, targetFile);
  console.log("✅ Restauré :", relativePath.replace(/\\/g, "/"));
}

console.log("");
console.log("✅ Rollback Phase 35S terminé.");
