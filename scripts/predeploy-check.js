const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const RUN_BUILD = process.argv.includes("--build");

function run(label, command, args) {
  const startedAt = Date.now();

  console.log("");
  console.log(`▶ ${label}`);
  console.log(`$ ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
  });

  const durationMs = Date.now() - startedAt;

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    label,
    command: `${command} ${args.join(" ")}`,
    status: result.status === 0 ? "ok" : "failed",
    exitCode: result.status,
    durationMs,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

const tasks = [];

if (fileExists("scripts/audit-page-stability.js")) {
  tasks.push(["Audit pages/layouts", "node", ["scripts/audit-page-stability.js"]]);
}

if (fileExists("scripts/audit-mobile-tables.js")) {
  tasks.push(["Audit tables mobiles", "node", ["scripts/audit-mobile-tables.js"]]);
}

if (fileExists("scripts/audit-route-states.js")) {
  tasks.push(["Audit états routes", "node", ["scripts/audit-route-states.js"]]);
}

if (fileExists("scripts/cleanup-generated-backups.js")) {
  tasks.push(["Scan fichiers temporaires", "node", ["scripts/cleanup-generated-backups.js"]]);
}

if (RUN_BUILD) {
  tasks.push(["Build Next.js", "npm", ["run", "build"]]);
}

const results = tasks.map(([label, command, args]) => run(label, command, args));
const failed = results.filter((row) => row.status === "failed");

const report = [
  "# Mpangi-church — Rapport pré-déploiement",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "## Résumé",
  "",
  `- Contrôles exécutés : ${results.length}`,
  `- Succès : ${results.filter((row) => row.status === "ok").length}`,
  `- Échecs : ${failed.length}`,
  `- Build exécuté : ${RUN_BUILD ? "oui" : "non"}`,
  "",
  "## Détail",
  "",
  "| Contrôle | Statut | Durée | Commande |",
  "|---|---|---:|---|",
  ...results.map(
    (row) =>
      `| ${row.label} | ${row.status === "ok" ? "✅ OK" : "❌ Échec"} | ${Math.round(row.durationMs / 1000)}s | \`${row.command}\` |`
  ),
  "",
  "## Fichiers à consulter",
  "",
  "- `PAGE_STABILITY_REPORT.md`",
  "- `MOBILE_TABLES_AUDIT_REPORT.md`",
  "- `ROUTE_STATES_COVERAGE_REPORT.md`",
  "",
  failed.length
    ? "## Échecs\n\n" +
      failed
        .map(
          (row) =>
            `### ${row.label}\n\nCommande : \`${row.command}\`\n\nExit code : ${row.exitCode}\n\n`
        )
        .join("\n")
    : "## Conclusion\n\nLes contrôles sont passés. Vérifie les rapports avant le push.",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "PREDEPLOY_CHECK_REPORT.md"), report, "utf8");

console.log("");
console.log("Rapport pré-déploiement : PREDEPLOY_CHECK_REPORT.md");

if (failed.length) {
  console.log("");
  console.log("Des contrôles ont échoué. Corrige avant de pousser.");
  process.exit(1);
}

console.log("Pré-déploiement OK.");
