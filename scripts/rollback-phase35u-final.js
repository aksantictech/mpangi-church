const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const BACKUP_ROOT = path.join(
  ROOT,
  ".phase35u-final-backup"
);

const manifestPath = path.join(
  BACKUP_ROOT,
  "manifest.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error(
    "❌ Manifest de sauvegarde introuvable."
  );

  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(
    manifestPath,
    "utf8"
  )
);

for (const item of manifest) {
  const targetPath = path.join(
    ROOT,
    item.relativePath
  );

  const backupPath = path.join(
    BACKUP_ROOT,
    item.relativePath
  );

  if (
    item.existed &&
    fs.existsSync(backupPath)
  ) {
    fs.mkdirSync(
      path.dirname(targetPath),
      {
        recursive: true,
      }
    );

    fs.copyFileSync(
      backupPath,
      targetPath
    );

    console.log(
      "✅ Restauré :",
      item.relativePath
    );
  } else if (
    !item.existed &&
    fs.existsSync(targetPath)
  ) {
    fs.rmSync(
      targetPath,
      {
        force: true,
      }
    );

    console.log(
      "✅ Supprimé :",
      item.relativePath
    );
  }
}

console.log("");
console.log(
  "✅ Retour arrière Phase 35U terminé."
);
