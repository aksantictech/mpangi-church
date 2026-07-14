const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function main() {
  const backupDir = path.resolve(process.cwd(), arg("--backup-dir") || "");
  if (!backupDir || !fs.existsSync(backupDir)) {
    throw new Error("--backup-dir invalide.");
  }

  const manifestPath = path.join(backupDir, "backup-manifest.json");
  const files = walk(backupDir)
    .filter((filePath) => filePath !== manifestPath)
    .map((filePath) => {
      const stats = fs.statSync(filePath);
      return {
        path: path.relative(backupDir, filePath).replace(/\\/g, "/"),
        size: stats.size,
        sha256: sha256(filePath),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const required = [
    "database/roles.sql",
    "database/schema.sql",
    "database/data.sql",
  ];

  const present = new Set(files.map((item) => item.path));
  const missingRequired = required.filter((item) => !present.has(item));

  const manifest = {
    formatVersion: 1,
    application: "Mpangi-Church",
    generatedAt: new Date().toISOString(),
    files,
    totals: {
      files: files.length,
      bytes: files.reduce((total, item) => total + item.size, 0),
    },
    validation: {
      missingRequired,
      storageManifestPresent: present.has("storage/storage-manifest.json"),
    },
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Manifest : ${manifestPath}`);
  console.log(`Fichiers : ${manifest.totals.files}`);

  if (missingRequired.length) {
    console.error("❌ Fichiers obligatoires absents :", missingRequired.join(", "));
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error("❌", error.message || error);
  process.exit(1);
}
