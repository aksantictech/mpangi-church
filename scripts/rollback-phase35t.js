const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BACKUP = path.join(
  ROOT,
  ".phase35t-backup"
);

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, {
      withFileTypes: true,
    })
    .flatMap((entry) => {
      const fullPath = path.join(
        directory,
        entry.name
      );

      if (entry.isDirectory()) {
        return walk(fullPath);
      }

      return [fullPath];
    });
}

if (!fs.existsSync(BACKUP)) {
  console.error(
    "❌ Aucun backup Phase 35T."
  );
  process.exit(1);
}

for (const backupPath of walk(BACKUP)) {
  const relativePath = path.relative(
    BACKUP,
    backupPath
  );

  const targetPath = path.join(
    ROOT,
    relativePath
  );

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

  console.log("✅ Restauré :", relativePath);
}

console.log("");
console.log(
  "✅ Retour arrière Phase 35T terminé."
);
