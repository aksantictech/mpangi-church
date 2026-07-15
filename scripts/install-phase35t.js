const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(
  ROOT,
  "payload"
);

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

if (!fs.existsSync(PAYLOAD)) {
  console.error(
    "❌ Dossier payload introuvable."
  );
  process.exit(1);
}

const files = walk(PAYLOAD);
const report = [];

for (const sourcePath of files) {
  const relativePath = path.relative(
    PAYLOAD,
    sourcePath
  );

  const targetPath = path.join(
    ROOT,
    relativePath
  );

  const backupPath = path.join(
    BACKUP,
    relativePath
  );

  fs.mkdirSync(
    path.dirname(targetPath),
    {
      recursive: true,
    }
  );

  if (fs.existsSync(targetPath)) {
    fs.mkdirSync(
      path.dirname(backupPath),
      {
        recursive: true,
      }
    );

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(
        targetPath,
        backupPath
      );
    }
  }

  fs.copyFileSync(
    sourcePath,
    targetPath
  );

  report.push(relativePath);
  console.log("✅", relativePath);
}

const gitignorePath = path.join(
  ROOT,
  ".gitignore"
);

const ignoreRules = [
  ".phase35t-backup/",
  "payload/",
];

let gitignore = fs.existsSync(
  gitignorePath
)
  ? fs.readFileSync(
      gitignorePath,
      "utf8"
    )
  : "";

for (const rule of ignoreRules) {
  if (!gitignore.includes(rule)) {
    gitignore += `\n${rule}`;
  }
}

fs.writeFileSync(
  gitignorePath,
  `${gitignore.trim()}\n`,
  "utf8"
);

fs.writeFileSync(
  path.join(
    ROOT,
    "PHASE35T_INSTALL_REPORT.md"
  ),
  [
    "# Rapport d’installation Phase 35T",
    "",
    ...report.map(
      (item) => `- ${item}`
    ),
    "",
    "Sauvegardes : `.phase35t-backup/`",
    "",
    "SQL à exécuter : `phase35t_users_and_donations.sql`",
  ].join("\n"),
  "utf8"
);

console.log("");
console.log(
  "✅ Phase 35T installée."
);
console.log(
  "Exécutez maintenant le SQL puis le contrôle."
);
