const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const BACKUP_ROOT =
  path.join(
    ROOT,
    ".phase35w2-backup"
  );

function walk(directory) {
  if (
    !fs.existsSync(
      directory
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      directory,
      {
        withFileTypes: true,
      }
    )
    .flatMap(
      (entry) => {
        const fullPath =
          path.join(
            directory,
            entry.name
          );

        return entry.isDirectory()
          ? walk(fullPath)
          : [fullPath];
      }
    );
}

if (
  !fs.existsSync(
    BACKUP_ROOT
  )
) {
  console.error(
    "❌ Aucun backup Phase 35W-2."
  );

  process.exit(1);
}

for (const backupPath of walk(
  BACKUP_ROOT
)) {
  const relativePath =
    path.relative(
      BACKUP_ROOT,
      backupPath
    );

  const targetPath =
    path.join(
      ROOT,
      relativePath
    );

  fs.mkdirSync(
    path.dirname(
      targetPath
    ),
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
    relativePath
  );
}

console.log("");
console.log(
  "✅ Retour arrière Phase 35W-2 terminé."
);
