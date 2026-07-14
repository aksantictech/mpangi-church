const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function main() {
  const backupDir = path.resolve(process.cwd(), arg("--backup-dir") || "");
  const manifestPath = path.join(backupDir, "backup-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error("backup-manifest.json introuvable.");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const findings = [];

  for (const item of manifest.files || []) {
    const filePath = path.join(backupDir, ...item.path.split("/"));

    if (!fs.existsSync(filePath)) {
      findings.push({ code: "FILE_MISSING", file: item.path });
      continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size !== item.size) {
      findings.push({ code: "SIZE_MISMATCH", file: item.path });
    }

    if (sha256(filePath) !== item.sha256) {
      findings.push({ code: "CHECKSUM_MISMATCH", file: item.path });
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    filesExpected: manifest.files?.length || 0,
    findings,
    valid: findings.length === 0,
  };

  fs.writeFileSync(
    path.join(backupDir, "backup-verification.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log(`Fichiers contrôlés : ${report.filesExpected}`);
  console.log(`Anomalies : ${findings.length}`);
  console.log(report.valid ? "✅ Sauvegarde intègre." : "❌ Sauvegarde invalide.");

  if (!report.valid) process.exitCode = 2;
}

try {
  main();
} catch (error) {
  console.error("❌", error.message || error);
  process.exit(1);
}
