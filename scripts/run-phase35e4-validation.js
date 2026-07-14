const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();

const scripts = [
  "scripts/audit-role-matrix-phase35e4.js",
  "scripts/generate-phase35e4-real-checklist.js",
];

let hardFailure = false;

for (const script of scripts) {
  console.log("");
  console.log("▶", script);

  const result = spawnSync(
    process.execPath,
    [path.join(ROOT, script)],
    {
      cwd: ROOT,
      stdio: "inherit",
    }
  );

  if (
    result.status !== 0 &&
    result.status !== 2
  ) {
    hardFailure = true;
  }
}

if (hardFailure) {
  console.error("");
  console.error(
    "❌ La validation Phase 35E-4 a échoué."
  );
  process.exit(1);
}

console.log("");
console.log(
  "✅ Validation Phase 35E-4 terminée."
);
