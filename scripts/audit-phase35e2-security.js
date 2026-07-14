const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");

const routeMap = [
  ["members", ["members"]],
  ["attendance", ["attendance"]],
  ["souls", ["souls"]],
  ["departments", ["departments"]],
  ["events", ["events"]],
  ["public-requests", ["public_requests"]],
  ["teachings", ["teachings"]],
  ["notifications", ["notifications"]],
  [
    "finance",
    [
      "finance_dashboard",
      "offerings",
      "expenses",
      "budgets",
      "finance_reports",
      "donations",
    ],
  ],
  [
    "patrimony",
    [
      "patrimony",
      "assets",
      "maintenance",
      "movements",
    ],
  ],
  [
    "administration",
    [
      "correspondence",
      "inbox",
      "transmissions",
      "tasks",
      "minutes",
    ],
  ],
  ["extensions", ["extensions"]],
  ["settings/users", ["users"]],
  ["settings/roles", ["security"]],
  ["dashboard/role", ["role_dashboard"]],
  ["my-work", ["my_work"]],
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

const layoutAudit = routeMap.map(
  ([route, modules]) => {
    const layoutPath = path.join(
      APP,
      route,
      "layout.tsx"
    );

    const exists = fs.existsSync(layoutPath);
    const source = exists
      ? fs.readFileSync(layoutPath, "utf8")
      : "";

    return {
      route: `/${route}`,
      modules,
      layout: path
        .relative(ROOT, layoutPath)
        .replace(/\\/g, "/"),
      exists,
      guarded:
        source.includes(
          "requireAnyModulePermission"
        ) ||
        source.includes(
          "requireModulePermission"
        ) ||
        source.includes(
          "requireRoutePermission"
        ),
    };
  }
);

const actionFiles = walk(APP)
  .filter((filePath) =>
    /(?:actions|route)\.(ts|tsx)$/.test(filePath)
  )
  .map((filePath) => {
    const source = fs.readFileSync(
      filePath,
      "utf8"
    );

    const isServerAction =
      source.includes('"use server"') ||
      source.includes("'use server'");

    const isRoute =
      /\/route\.(ts|tsx)$/.test(
        filePath.replace(/\\/g, "/")
      );

    if (!isServerAction && !isRoute) {
      return null;
    }

    return {
      file: path
        .relative(ROOT, filePath)
        .replace(/\\/g, "/"),
      kind: isRoute
        ? "route_handler"
        : "server_action",
      hasPermissionGuard:
        source.includes(
          "requireActionPermission"
        ) ||
        source.includes(
          "requireAnyActionPermission"
        ) ||
        source.includes(
          "requireModulePermission"
        ) ||
        source.includes(
          "requireAnyModulePermission"
        ) ||
        source.includes(
          "getCurrentSecurityContext"
        ),
      exportedMutations:
        (
          source.match(
            /export\s+(?:async\s+)?function\s+\w+/g
          ) || []
        ).length,
    };
  })
  .filter(Boolean);

const unguardedActions = actionFiles.filter(
  (item) => !item.hasPermissionGuard
);

const report = {
  generatedAt: new Date().toISOString(),
  layouts: layoutAudit,
  actionFiles,
  unguardedActions,
};

fs.writeFileSync(
  path.join(
    ROOT,
    "phase35e2-security-audit.json"
  ),
  JSON.stringify(report, null, 2),
  "utf8"
);

const markdown = [
  "# Audit sécurité Phase 35E-2",
  "",
  "## Layouts",
  "",
  "| Route | Layout | Existe | Garde détectée | Modules |",
  "|---|---|---:|---:|---|",
  ...layoutAudit.map(
    (item) =>
      `| ${item.route} | ${item.layout} | ${item.exists ? "oui" : "non"} | ${item.guarded ? "oui" : "non"} | ${item.modules.join(", ")} |`
  ),
  "",
  "## Server Actions et Route Handlers sans garde détectée",
  "",
  ...(unguardedActions.length
    ? unguardedActions.map(
        (item) =>
          `- ${item.file} — ${item.kind} — ${item.exportedMutations} export(s)`
      )
    : ["- Aucun"]),
  "",
  "La détection est statique : une garde indirecte peut ne pas être reconnue.",
];

fs.writeFileSync(
  path.join(
    ROOT,
    "PHASE35E2_SECURITY_AUDIT.md"
  ),
  markdown.join("\n"),
  "utf8"
);

console.log(
  "Layouts contrôlés :",
  layoutAudit.length
);
console.log(
  "Layouts sans garde :",
  layoutAudit.filter(
    (item) => !item.guarded
  ).length
);
console.log(
  "Actions/routes sans garde détectée :",
  unguardedActions.length
);
console.log(
  "Rapport : PHASE35E2_SECURITY_AUDIT.md"
);
