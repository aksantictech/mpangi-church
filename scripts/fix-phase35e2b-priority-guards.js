const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PRIORITY_TARGETS = [
  {
    file: "src/app/api/finance/reports/export/route.ts",
    modules: ["finance_reports", "financial_reports"],
    defaultAction: "view",
  },
  {
    file: "src/app/api/members/actions/route.ts",
    modules: ["members"],
    defaultAction: "update",
  },
  {
    file: "src/app/api/settings/users/new/actions.ts",
    modules: ["users"],
    defaultAction: "create",
  },
  {
    file: "src/app/finance/actions.ts",
    modules: [
      "finance_dashboard",
      "offerings",
      "expenses",
      "budgets",
    ],
    defaultAction: "update",
  },
  {
    file: "src/app/finance/budgets/actions.ts",
    modules: ["budgets"],
    defaultAction: "update",
  },
  {
    file: "src/app/finance/donations/actions.ts",
    modules: ["donations"],
    defaultAction: "approve",
  },
  {
    file: "src/app/patrimony/actions.ts",
    modules: [
      "patrimony",
      "patrimony_dashboard",
      "assets",
      "maintenance",
      "asset_maintenance",
      "movements",
      "asset_movements",
    ],
    defaultAction: "update",
  },
  {
    file: "src/app/settings/users/new/actions.ts",
    modules: ["users"],
    defaultAction: "create",
  },

  {
    file: "src/app/administration/correspondence/actions.ts",
    modules: ["correspondence"],
    defaultAction: "update",
  },
  {
    file: "src/app/administration/minutes/actions.ts",
    modules: ["minutes", "meetings_minutes"],
    defaultAction: "update",
  },
  {
    file: "src/app/administration/tasks/actions.ts",
    modules: ["tasks", "administrative_tasks"],
    defaultAction: "update",
  },
  {
    file: "src/app/administration/transmissions/actions.ts",
    modules: ["transmissions", "document_transmissions"],
    defaultAction: "update",
  },
  {
    file: "src/app/api/attendance/event-presence/route.ts",
    modules: ["attendance"],
    defaultAction: "update",
  },
  {
    file: "src/app/api/attendance/export/route.ts",
    modules: ["attendance"],
    defaultAction: "view",
  },
  {
    file: "src/app/api/attendance/scan/route.ts",
    modules: ["attendance"],
    defaultAction: "create",
  },
  {
    file: "src/app/api/souls/[id]/convert-to-member/route.ts",
    modules: ["souls", "members"],
    defaultAction: "create",
  },
];

const report = {
  extensionLayout: null,
  files: [],
};

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function addImport(source, importLine, marker) {
  if (source.includes(marker)) {
    return source;
  }

  const importBlock = source.match(
    /^(?:(?:["']use (?:server|client)["'];\s*\n)?(?:import[\s\S]*?;\s*\n)+)/
  );

  if (importBlock) {
    const insertionPoint = importBlock[0].length;

    return (
      source.slice(0, insertionPoint) +
      importLine +
      source.slice(insertionPoint)
    );
  }

  const directiveMatch = source.match(
    /^(["']use (?:server|client)["'];\s*\n)/
  );

  if (directiveMatch) {
    return (
      directiveMatch[0] +
      importLine +
      source.slice(directiveMatch[0].length)
    );
  }

  return importLine + source;
}

function inferAction(functionName, defaultAction) {
  const normalized = String(functionName || "").toLowerCase();

  if (
    /^(get|list|read|load|fetch|export|download)|export|report/.test(
      normalized
    )
  ) {
    return "view";
  }

  if (
    /approve|confirm|validate|verify|accept|reject/.test(normalized)
  ) {
    return "approve";
  }

  if (
    /delete|remove|archive|trash|purge/.test(normalized)
  ) {
    return "delete";
  }

  if (
    /create|add|insert|register|convert|scan|subscribe|invite|send/.test(
      normalized
    )
  ) {
    return "create";
  }

  if (
    /update|edit|modify|change|set|toggle|mark|assign|move|close|reopen/.test(
      normalized
    )
  ) {
    return "update";
  }

  return defaultAction;
}

function inferRouteAction(functionName, defaultAction) {
  switch (functionName) {
    case "GET":
    case "HEAD":
      return "view";
    case "POST":
      return defaultAction === "approve"
        ? "approve"
        : "create";
    case "PUT":
    case "PATCH":
      return defaultAction === "approve"
        ? "approve"
        : "update";
    case "DELETE":
      return "delete";
    default:
      return inferAction(functionName, defaultAction);
  }
}

function patchExportedAsyncFunctions(
  source,
  modules,
  defaultAction
) {
  const modulesLiteral = JSON.stringify(modules);
  const patchedFunctions = [];
  const unresolvedFunctions = [];

  const functionRegex =
    /export\s+async\s+function\s+([A-Za-z_$][\w$]*)\s*\(([\s\S]*?)\)\s*(?::\s*[^{=]+)?\s*\{/g;

  source = source.replace(
    functionRegex,
    (fullMatch, functionName) => {
      const action = inferRouteAction(
        functionName,
        defaultAction
      );

      const guard =
        action === "view"
          ? `\n  await requireAnyModulePermission(${modulesLiteral}, "view");`
          : `\n  await requireAnyActionPermission(${modulesLiteral}, "${action}");`;

      const startIndex =
        arguments.length > 3
          ? arguments[arguments.length - 2]
          : -1;

      const afterMatch = source.slice(
        Number(startIndex) + fullMatch.length,
        Number(startIndex) + fullMatch.length + 260
      );

      if (
        afterMatch.includes(
          "requireAnyModulePermission("
        ) ||
        afterMatch.includes(
          "requireAnyActionPermission("
        ) ||
        afterMatch.includes(
          "requireActionPermission("
        )
      ) {
        patchedFunctions.push({
          name: functionName,
          action,
          status: "already_guarded",
        });
        return fullMatch;
      }

      patchedFunctions.push({
        name: functionName,
        action,
        status: "patched",
      });

      return fullMatch + guard;
    }
  );

  const constHandlerRegex =
    /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*async\s*\(([\s\S]*?)\)\s*(?::\s*[^=]+)?=>\s*\{/g;

  source = source.replace(
    constHandlerRegex,
    (fullMatch, functionName) => {
      const action = inferRouteAction(
        functionName,
        defaultAction
      );

      const guard =
        action === "view"
          ? `\n  await requireAnyModulePermission(${modulesLiteral}, "view");`
          : `\n  await requireAnyActionPermission(${modulesLiteral}, "${action}");`;

      patchedFunctions.push({
        name: functionName,
        action,
        status: "patched_arrow",
      });

      return fullMatch + guard;
    }
  );

  const exportedNames = [
    ...(source.matchAll(
      /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
    )),
    ...(source.matchAll(
      /export\s+const\s+([A-Za-z_$][\w$]*)\s*=/g
    )),
  ].map((match) => match[1]);

  const patchedNames = new Set(
    patchedFunctions.map((item) => item.name)
  );

  for (const name of exportedNames) {
    if (!patchedNames.has(name)) {
      unresolvedFunctions.push(name);
    }
  }

  return {
    source,
    patchedFunctions,
    unresolvedFunctions: [
      ...new Set(unresolvedFunctions),
    ],
  };
}

function patchExtensionLayout() {
  const filePath = path.join(
    ROOT,
    "src",
    "app",
    "extensions",
    "layout.tsx"
  );

  if (!fs.existsSync(filePath)) {
    report.extensionLayout = {
      status: "missing",
      file: relative(filePath),
    };
    console.log(
      "⚠️ Layout extensions introuvable."
    );
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes("requireAnyModulePermission") ||
    source.includes("requireModulePermission") ||
    source.includes("requireRoutePermission")
  ) {
    report.extensionLayout = {
      status: "already_guarded",
      file: relative(filePath),
    };
    console.log(
      "ℹ️ Layout extensions déjà protégé."
    );
    return;
  }

  backup(filePath, "phase35e2b");

  source = addImport(
    source,
    'import { requireAnyModulePermission } from "@/lib/security/routeGuard";\n',
    "@/lib/security/routeGuard"
  );

  let patched = false;

  source = source.replace(
    /export\s+default\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)?\s*\(([\s\S]*?)\)\s*\{/,
    (fullMatch, asyncKeyword) => {
      patched = true;

      const normalized = asyncKeyword
        ? fullMatch
        : fullMatch.replace(
            "export default function",
            "export default async function"
          );

      return (
        normalized +
        '\n  await requireAnyModulePermission(["extensions", "extension_activities", "extension_reports"], "view");'
      );
    }
  );

  if (!patched) {
    report.extensionLayout = {
      status: "manual_required",
      file: relative(filePath),
      reason:
        "default_export_shape_not_recognized",
    };

    console.log(
      "❌ Layout extensions non reconnu. Correction manuelle requise."
    );
    return;
  }

  fs.writeFileSync(filePath, source, "utf8");

  report.extensionLayout = {
    status: "patched",
    file: relative(filePath),
  };

  console.log(
    "✅ Layout extensions protégé."
  );
}

function patchPriorityFile(target) {
  const filePath = path.join(ROOT, target.file);

  if (!fs.existsSync(filePath)) {
    report.files.push({
      file: target.file,
      status: "missing",
      patchedFunctions: [],
      unresolvedFunctions: [],
    });

    console.log("⚠️ Introuvable :", target.file);
    return;
  }

  let source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes(
      "@/lib/security/secureAction"
    ) ||
    source.includes(
      "@/lib/security/routeGuard"
    )
  ) {
    report.files.push({
      file: target.file,
      status: "already_has_security_import",
      patchedFunctions: [],
      unresolvedFunctions: [],
    });

    console.log(
      "ℹ️ Garde déjà présente :",
      target.file
    );
    return;
  }

  backup(filePath, "phase35e2b");

  source = addImport(
    source,
    'import { requireAnyActionPermission } from "@/lib/security/secureAction";\nimport { requireAnyModulePermission } from "@/lib/security/routeGuard";\n',
    "@/lib/security/secureAction"
  );

  const result = patchExportedAsyncFunctions(
    source,
    target.modules,
    target.defaultAction
  );

  const hasPatched = result.patchedFunctions.some(
    (item) =>
      item.status === "patched" ||
      item.status === "patched_arrow"
  );

  if (!hasPatched) {
    report.files.push({
      file: target.file,
      status: "manual_required",
      patchedFunctions:
        result.patchedFunctions,
      unresolvedFunctions:
        result.unresolvedFunctions,
    });

    console.log(
      "❌ Aucun export patché :",
      target.file
    );
    return;
  }

  fs.writeFileSync(
    filePath,
    result.source,
    "utf8"
  );

  report.files.push({
    file: target.file,
    status:
      result.unresolvedFunctions.length > 0
        ? "partial"
        : "patched",
    patchedFunctions:
      result.patchedFunctions,
    unresolvedFunctions:
      result.unresolvedFunctions,
  });

  console.log(
    "✅ Gardes ajoutées :",
    target.file
  );
}

patchExtensionLayout();

for (const target of PRIORITY_TARGETS) {
  patchPriorityFile(target);
}

const jsonPath = path.join(
  ROOT,
  "phase35e2b-patch-report.json"
);

fs.writeFileSync(
  jsonPath,
  JSON.stringify(report, null, 2),
  "utf8"
);

const manual = report.files.filter(
  (item) =>
    item.status === "manual_required" ||
    item.status === "partial" ||
    item.status === "missing"
);

const markdown = [
  "# Rapport correctif Phase 35E-2B",
  "",
  "## Layout Extensions",
  "",
  `- ${report.extensionLayout?.file || "-"} — ${report.extensionLayout?.status || "unknown"}`,
  "",
  "## Fichiers traités",
  "",
  ...report.files.map(
    (item) =>
      `- ${item.file} — ${item.status} — ${(item.patchedFunctions || []).length} fonction(s) inspectée(s)`
  ),
  "",
  "## Corrections manuelles restantes",
  "",
  ...(manual.length
    ? manual.map(
        (item) =>
          `- ${item.file} — ${item.status} — exports non résolus : ${(item.unresolvedFunctions || []).join(", ") || "-"}`
      )
    : ["- Aucune"]),
  "",
  "Le script crée une sauvegarde .phase35e2b.bak avant chaque modification.",
];

fs.writeFileSync(
  path.join(
    ROOT,
    "PHASE35E2B_PATCH_REPORT.md"
  ),
  markdown.join("\n"),
  "utf8"
);

console.log("");
console.log(
  "✅ Traitement Phase 35E-2B terminé."
);
console.log(
  "Rapport : PHASE35E2B_PATCH_REPORT.md"
);

if (
  report.extensionLayout?.status ===
    "manual_required" ||
  manual.some(
    (item) =>
      item.status === "manual_required"
  )
) {
  process.exitCode = 2;
}
