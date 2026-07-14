const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");

const PUBLIC_ROUTE_PATTERNS = [
  /api\/bible\//,
  /api\/pwa\//,
  /manifest/,
  /church\/\[slug\]\/icon\.png/,
  /church\/\[slug\]\/manifest\.webmanifest/,
  /api\/public\/church-donations/,
  /api\/public\/member-registration/,
];

const INDIRECT_GUARD_MARKERS = [
  "requireSuperAdminAccess",
  "requireAuthenticatedAccess",
  "requireAnyActionPermission",
  "requireAnyModulePermission",
  "requireModulePermission",
  "getCurrentSecurityContext",
  "getAllowedNavigationItems",
  "getCurrentRolePermissions",
];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

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

const candidates = walk(APP)
  .filter((filePath) =>
    /(?:actions|route)\.(ts|tsx)$/.test(filePath)
  )
  .map((filePath) => {
    const relativePath = path
      .relative(ROOT, filePath)
      .replace(/\\/g, "/");

    const source = fs.readFileSync(
      filePath,
      "utf8"
    );

    const publicRoute = PUBLIC_ROUTE_PATTERNS.some(
      (pattern) => pattern.test(relativePath)
    );

    const guarded = INDIRECT_GUARD_MARKERS.some(
      (marker) => source.includes(marker)
    );

    return {
      file: relativePath,
      publicRoute,
      guarded,
      status: publicRoute
        ? "PUBLIC"
        : guarded
          ? "GUARDED"
          : "REVIEW",
    };
  });

const summary = {
  total: candidates.length,
  public: candidates.filter(
    (item) => item.status === "PUBLIC"
  ).length,
  guarded: candidates.filter(
    (item) => item.status === "GUARDED"
  ).length,
  review: candidates.filter(
    (item) => item.status === "REVIEW"
  ).length,
};

fs.writeFileSync(
  path.join(
    ROOT,
    "phase35e2c-security-audit.json"
  ),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      files: candidates,
    },
    null,
    2
  ),
  "utf8"
);

const review = candidates.filter(
  (item) => item.status === "REVIEW"
);

const markdown = [
  "# Audit Phase 35E-2C",
  "",
  `Fichiers contrôlés : ${summary.total}`,
  `Routes publiques assumées : ${summary.public}`,
  `Fichiers protégés : ${summary.guarded}`,
  `Fichiers à examiner : ${summary.review}`,
  "",
  "## Fichiers à examiner",
  "",
  ...(review.length
    ? review.map((item) => `- ${item.file}`)
    : ["- Aucun"]),
  "",
  "Une route publique ne doit pas recevoir automatiquement une garde nécessitant une session.",
];

fs.writeFileSync(
  path.join(
    ROOT,
    "PHASE35E2C_SECURITY_AUDIT.md"
  ),
  markdown.join("\n"),
  "utf8"
);

console.log("Fichiers contrôlés :", summary.total);
console.log("Routes publiques :", summary.public);
console.log("Fichiers protégés :", summary.guarded);
console.log("À examiner :", summary.review);
console.log(
  "Rapport : PHASE35E2C_SECURITY_AUDIT.md"
);
