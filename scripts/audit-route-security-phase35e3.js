const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const PUBLIC_PATTERNS = [
  /api\/bible\//,
  /api\/pwa\//,
  /api\/public\//,
  /manifest/,
  /church\/\[slug\]\/icon\.png/,
  /church\/\[slug\]\/manifest\.webmanifest/,
];
const GUARDS = [
  "requireSuperAdminAccess",
  "requireAuthenticatedAccess",
  "requireAnyActionPermission",
  "requireAnyModulePermission",
  "requireModulePermission",
  "getCurrentSecurityContext",
  "getAllowedNavigationItems",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const rows = walk(APP)
  .filter((file) => /(?:actions|route)\.(ts|tsx)$/.test(file))
  .map((file) => {
    const relative = path.relative(ROOT, file).replace(/\\/g, "/");
    const source = fs.readFileSync(file, "utf8");
    const publicRoute = PUBLIC_PATTERNS.some((p) => p.test(relative));
    const guard = GUARDS.find((g) => source.includes(g));
    const critical = /super-admin|broadcast|documents\/download|settings\//.test(relative);

    return {
      file: relative,
      status: publicRoute ? "PUBLIC" : guard ? "GUARDED" : critical ? "CRITICAL_REVIEW" : "REVIEW",
      guard: guard || null,
    };
  });

const summary = {
  total: rows.length,
  public: rows.filter((r) => r.status === "PUBLIC").length,
  guarded: rows.filter((r) => r.status === "GUARDED").length,
  criticalReview: rows.filter((r) => r.status === "CRITICAL_REVIEW").length,
  review: rows.filter((r) => r.status === "REVIEW").length,
};

fs.writeFileSync(
  path.join(ROOT, "phase35e3-route-security-audit.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), summary, files: rows }, null, 2),
  "utf8"
);

const critical = rows.filter((r) => r.status === "CRITICAL_REVIEW");
const review = rows.filter((r) => r.status === "REVIEW");

fs.writeFileSync(
  path.join(ROOT, "PHASE35E3_ROUTE_SECURITY_AUDIT.md"),
  [
    "# Audit des routes Phase 35E-3",
    "",
    `Fichiers : ${summary.total}`,
    `Publics : ${summary.public}`,
    `Protégés : ${summary.guarded}`,
    `Révisions critiques : ${summary.criticalReview}`,
    `Autres révisions : ${summary.review}`,
    "",
    "## Critiques",
    "",
    ...(critical.length ? critical.map((r) => `- ${r.file}`) : ["- Aucune"]),
    "",
    "## Autres",
    "",
    ...(review.length ? review.map((r) => `- ${r.file}`) : ["- Aucune"]),
  ].join("\n"),
  "utf8"
);

console.table(summary);
console.log("Rapport : PHASE35E3_ROUTE_SECURITY_AUDIT.md");
