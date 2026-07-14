const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const filePath = path.join(
  ROOT,
  "src",
  "lib",
  "dashboard",
  "roleDashboard.ts"
);

if (!fs.existsSync(filePath)) {
  console.error("❌ Fichier introuvable :", filePath);
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");
const backupPath = `${filePath}.phase35e-dashboard-export.bak`;

if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log(
    "✅ Backup créé :",
    path.relative(ROOT, backupPath)
  );
}

const hasDataExport =
  /export\s+async\s+function\s+getRoleDashboardData\s*\(/.test(
    source
  ) ||
  /export\s+const\s+getRoleDashboardData\s*=/.test(source);

if (!hasDataExport) {
  console.error(
    "❌ getRoleDashboardData est absent de roleDashboard.ts."
  );
  process.exit(1);
}

const hasConfigExport =
  /export\s+async\s+function\s+getRoleDashboardConfig\s*\(/.test(
    source
  ) ||
  /export\s+const\s+getRoleDashboardConfig\s*=/.test(source);

if (hasConfigExport) {
  console.log(
    "ℹ️ getRoleDashboardConfig existe déjà. Aucun changement."
  );
  process.exit(0);
}

source += `

/**
 * Compatibilité Phase 35E.
 *
 * Certaines routes historiques utilisent encore
 * getRoleDashboardConfig(). Le moteur actuel expose
 * getRoleDashboardData(). Cet alias évite de casser ces routes
 * pendant la migration progressive.
 */
export async function getRoleDashboardConfig(
  ..._args: unknown[]
) {
  return getRoleDashboardData();
}
`;

fs.writeFileSync(filePath, source, "utf8");

console.log(
  "✅ Export getRoleDashboardConfig ajouté comme alias."
);
