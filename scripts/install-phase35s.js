const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(
  __dirname,
  "..",
  "payload"
);
const BACKUP_ROOT = path.join(
  ROOT,
  ".phase35s-backup"
);

function walk(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) return walk(fullPath);

      return [fullPath];
    });
}

if (!fs.existsSync(PAYLOAD)) {
  console.error("❌ Dossier payload introuvable.");
  process.exit(1);
}

const files = walk(PAYLOAD);
const installed = [];
const backedUp = [];

for (const payloadFile of files) {
  const relativePath = path.relative(PAYLOAD, payloadFile);
  const targetFile = path.join(ROOT, relativePath);
  const backupFile = path.join(BACKUP_ROOT, relativePath);

  if (fs.existsSync(targetFile)) {
    fs.mkdirSync(path.dirname(backupFile), {
      recursive: true,
    });

    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(targetFile, backupFile);
      backedUp.push(relativePath.replace(/\\/g, "/"));
    }
  }

  fs.mkdirSync(path.dirname(targetFile), {
    recursive: true,
  });
  fs.copyFileSync(payloadFile, targetFile);
  installed.push(relativePath.replace(/\\/g, "/"));
}

const obsoleteFilter = path.join(
  ROOT,
  "src/components/security/PermissionNavigationDomFilter.tsx"
);

const report = {
  installedAt: new Date().toISOString(),
  installed,
  backedUp,
  obsoleteFilterPreserved: fs.existsSync(obsoleteFilter),
  sqlRequired: "phase35s_production_stabilization.sql",
};

fs.writeFileSync(
  path.join(ROOT, "phase35s-install-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

const markdown = [
  "# Rapport d’installation Phase 35S",
  "",
  `Fichiers installés : ${installed.length}`,
  `Sauvegardes créées : ${backedUp.length}`,
  "",
  "## Étape obligatoire avant déploiement",
  "",
  "Exécuter `phase35s_production_stabilization.sql` dans Supabase SQL Editor.",
  "",
  "## Sauvegarde locale",
  "",
  "Les versions précédentes sont conservées dans `.phase35s-backup/`.",
];

fs.writeFileSync(
  path.join(ROOT, "PHASE35S_INSTALL_REPORT.md"),
  markdown.join("\n"),
  "utf8"
);

console.log(`✅ ${installed.length} fichiers installés.`);
console.log(`✅ ${backedUp.length} sauvegardes créées.`);
console.log("Rapport : PHASE35S_INSTALL_REPORT.md");
console.log("");
console.log("⚠️ Exécuter ensuite phase35s_production_stabilization.sql dans Supabase.");
