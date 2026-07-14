const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const TEMPLATE_ROOT = path.join(
  ROOT,
  "templates",
  "layouts"
);

const layoutTargets = [
  "members",
  "attendance",
  "souls",
  "departments",
  "events",
  "public-requests",
  "teachings",
  "notifications",
  "finance",
  "patrimony",
  "administration",
  "extensions",
  "settings/users",
  "settings/roles",
  "dashboard/role",
  "my-work",
];

const report = {
  installedLayouts: [],
  skippedLayouts: [],
  proxy: {
    status: "not_checked",
    source: null,
    target: null,
  },
};

function installLayouts() {
  for (const relativeDirectory of layoutTargets) {
    const templatePath = path.join(
      TEMPLATE_ROOT,
      relativeDirectory,
      "layout.tsx"
    );

    const targetPath = path.join(
      APP,
      relativeDirectory,
      "layout.tsx"
    );

    if (!fs.existsSync(templatePath)) {
      report.skippedLayouts.push({
        route: relativeDirectory,
        reason: "template_missing",
      });
      continue;
    }

    if (fs.existsSync(targetPath)) {
      report.skippedLayouts.push({
        route: relativeDirectory,
        reason:
          "layout_exists_manual_integration_required",
      });
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), {
      recursive: true,
    });

    fs.copyFileSync(templatePath, targetPath);

    report.installedLayouts.push(relativeDirectory);
    console.log(
      "✅ Layout sécurisé :",
      relativeDirectory
    );
  }
}

function migrateMiddlewareToProxy() {
  const candidates = [
    path.join(ROOT, "src", "middleware.ts"),
    path.join(ROOT, "middleware.ts"),
    path.join(ROOT, "src", "middleware.js"),
    path.join(ROOT, "middleware.js"),
  ];

  const middlewarePath = candidates.find((filePath) =>
    fs.existsSync(filePath)
  );

  const possibleProxyPath = middlewarePath
    ? path.join(
        path.dirname(middlewarePath),
        `proxy${path.extname(middlewarePath)}`
      )
    : path.join(ROOT, "src", "proxy.ts");

  if (!middlewarePath) {
    if (fs.existsSync(possibleProxyPath)) {
      report.proxy = {
        status: "already_migrated",
        source: null,
        target: path.relative(
          ROOT,
          possibleProxyPath
        ),
      };
      console.log("ℹ️ proxy existe déjà.");
    } else {
      report.proxy = {
        status: "middleware_not_found",
        source: null,
        target: null,
      };
      console.log(
        "⚠️ middleware introuvable : migration proxy ignorée."
      );
    }

    return;
  }

  const proxyPath = possibleProxyPath;

  if (fs.existsSync(proxyPath)) {
    report.proxy = {
      status: "proxy_already_exists",
      source: path.relative(ROOT, middlewarePath),
      target: path.relative(ROOT, proxyPath),
    };
    console.log(
      "ℹ️ proxy existe déjà : middleware conservé pour vérification manuelle."
    );
    return;
  }

  const backupPath =
    `${middlewarePath}.phase35e2.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(middlewarePath, backupPath);
  }

  let source = fs.readFileSync(
    middlewarePath,
    "utf8"
  );

  source = source
    .replace(
      /export\s+async\s+function\s+middleware\s*\(/,
      "export async function proxy("
    )
    .replace(
      /export\s+function\s+middleware\s*\(/,
      "export function proxy("
    )
    .replace(
      /export\s+const\s+middleware\s*=/,
      "export const proxy ="
    )
    .replace(
      /function\s+middleware\s*\(/,
      "function proxy("
    );

  fs.writeFileSync(proxyPath, source, "utf8");

  const archivedMiddleware =
    `${middlewarePath}.deprecated`;

  fs.renameSync(
    middlewarePath,
    archivedMiddleware
  );

  report.proxy = {
    status: "migrated",
    source: path.relative(
      ROOT,
      archivedMiddleware
    ),
    target: path.relative(ROOT, proxyPath),
  };

  console.log(
    "✅ middleware migré vers",
    path.relative(ROOT, proxyPath)
  );
}

function writeReport() {
  const markdown = [
    "# Rapport d’installation Phase 35E-2",
    "",
    "## Layouts sécurisés installés",
    "",
    ...(report.installedLayouts.length
      ? report.installedLayouts.map(
          (route) => `- /${route}`
        )
      : ["- Aucun"]),
    "",
    "## Layouts existants non modifiés",
    "",
    ...(report.skippedLayouts.length
      ? report.skippedLayouts.map(
          (item) =>
            `- /${item.route} — ${item.reason}`
        )
      : ["- Aucun"]),
    "",
    "Un layout existant n’est jamais écrasé automatiquement.",
    "Il doit intégrer requireAnyModulePermission() manuellement.",
    "",
    "## Migration Proxy",
    "",
    `- Statut : ${report.proxy.status}`,
    `- Source : ${report.proxy.source || "-"}`,
    `- Cible : ${report.proxy.target || "-"}`,
  ];

  fs.writeFileSync(
    path.join(
      ROOT,
      "PHASE35E2_INSTALL_REPORT.md"
    ),
    markdown.join("\n"),
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      ROOT,
      "phase35e2-install-report.json"
    ),
    JSON.stringify(report, null, 2),
    "utf8"
  );
}

installLayouts();
migrateMiddlewareToProxy();
writeReport();

console.log("");
console.log("✅ Phase 35E-2 installée.");
console.log(
  "Rapport : PHASE35E2_INSTALL_REPORT.md"
);
