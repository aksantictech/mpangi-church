const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PARENT = path.dirname(ROOT);

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}

function ensureGitignoreRule(rule) {
  const gitignorePath = path.join(ROOT, ".gitignore");
  let content = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : "";

  const lines = content.split(/\r?\n/);

  if (!lines.includes(rule)) {
    content = `${content.trimEnd()}\n${rule}\n`;
    fs.writeFileSync(gitignorePath, content, "utf8");
    console.log(`✅ .gitignore : ${rule}`);
  }
}

function moveOutsideProject(relativePath, destinationName) {
  const source = path.join(ROOT, relativePath);

  if (!fs.existsSync(source)) {
    console.log(`ℹ️ Absent : ${relativePath}`);
    return;
  }

  const archiveRoot = path.join(
    PARENT,
    "mpangi-local-phase-backups"
  );

  fs.mkdirSync(archiveRoot, { recursive: true });

  const destination = path.join(
    archiveRoot,
    `${destinationName}-${timestamp()}`
  );

  fs.renameSync(source, destination);

  console.log(`✅ Déplacé hors du projet : ${relativePath}`);
  console.log(`   → ${destination}`);
}

function removeDirectory(relativePath) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`ℹ️ Absent : ${relativePath}`);
    return;
  }

  fs.rmSync(fullPath, {
    recursive: true,
    force: true,
  });

  console.log(`✅ Supprimé : ${relativePath}`);
}

moveOutsideProject(
  ".phase35t-backup",
  "phase35t-backup"
);

removeDirectory("payload");

ensureGitignoreRule("payload/");
ensureGitignoreRule(".phase35t-backup/");
ensureGitignoreRule(".phase35s-backup/");
ensureGitignoreRule("mpangi-*-context.zip");

console.log("");
console.log("✅ Nettoyage Phase 35T terminé.");
console.log(
  "Relancez maintenant : node scripts/check-phase35t.js"
);
console.log(
  "Puis : npx tsc --noEmit --pretty false"
);
