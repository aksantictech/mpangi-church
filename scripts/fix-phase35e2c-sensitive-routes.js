const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const TARGETS = [
  // Super Admin
  {
    file: "src/app/api/super-admin/church-modules/route.ts",
    guard: "super_admin",
  },
  {
    file: "src/app/api/super-admin/church-users/route.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/api/super-admin/church-users/[profileId]/route.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/api/super-admin/modules/toggle/route.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/api/super-admin/onboarding/route.ts",
    guard: "super_admin",
  },
  {
    file: "src/app/api/super-admin/route.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/api/super-admin/users/new/actions.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/super-admin/users/new/actions.ts",
    guard: "super_admin",
  },
  {
    file:
      "src/app/super-admin/profile/actions.ts",
    guard: "super_admin",
  },

  // APIs privées du compte
  {
    file: "src/app/api/account/me/route.ts",
    guard: "authenticated",
  },
  {
    file:
      "src/app/api/modules/my-modules/route.ts",
    guard: "authenticated",
  },
  {
    file:
      "src/app/api/security/my-access/route.ts",
    guard: "authenticated",
  },
  {
    file:
      "src/app/api/notifications/subscribe/route.ts",
    guard: "authenticated",
  },
  {
    file:
      "src/app/api/push/subscribe/route.ts",
    guard: "authenticated",
  },
  {
    file: "src/app/profile/actions.ts",
    guard: "authenticated",
  },

  // Modules et paramètres sensibles
  {
    file:
      "src/app/api/notifications/broadcast/route.ts",
    guard: "module",
    modules: ["notifications"],
    defaultAction: "approve",
  },
  {
    file:
      "src/app/api/documents/download/route.ts",
    guard: "module",
    modules: [
      "correspondence",
      "inbox",
      "transmissions",
      "document_transmissions",
      "minutes",
      "meetings_minutes",
      "assets",
      "members",
      "teachings",
    ],
    defaultAction: "view",
  },
  {
    file:
      "src/app/api/settings/live-stream/route.ts",
    guard: "module",
    modules: ["settings"],
    defaultAction: "update",
  },
  {
    file:
      "src/app/api/settings/member-registration/route.ts",
    guard: "module",
    modules: ["settings"],
    defaultAction: "update",
  },
  {
    file:
      "src/app/settings/donations/actions.ts",
    guard: "module",
    modules: ["settings", "donations"],
    defaultAction: "update",
  },
  {
    file: "src/app/teachings/actions.ts",
    guard: "module",
    modules: ["teachings"],
    defaultAction: "update",
  },
  {
    file: "src/app/transmissions/actions.ts",
    guard: "module",
    modules: [
      "transmissions",
      "document_transmissions",
    ],
    defaultAction: "update",
  },
];

const report = [];

function backup(filePath) {
  const backupPath =
    `${filePath}.phase35e2c.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function addImport(source, line, marker) {
  if (source.includes(marker)) return source;

  const directive = source.match(
    /^(["']use (?:server|client)["'];\s*\n)/
  );

  const importBlock = source.match(
    /^(?:(?:["']use (?:server|client)["'];\s*\n)?(?:import[\s\S]*?;\s*\n)+)/
  );

  if (importBlock) {
    const index = importBlock[0].length;

    return (
      source.slice(0, index) +
      line +
      source.slice(index)
    );
  }

  if (directive) {
    return (
      directive[0] +
      line +
      source.slice(directive[0].length)
    );
  }

  return line + source;
}

function inferAction(name, fallback) {
  const value = String(name).toLowerCase();

  if (
    /^(get|head|list|read|load|fetch|export|download)|report/.test(
      value
    )
  ) {
    return "view";
  }

  if (
    /approve|confirm|validate|verify|accept|reject|broadcast/.test(
      value
    )
  ) {
    return "approve";
  }

  if (/delete|remove|archive|trash|purge/.test(value)) {
    return "delete";
  }

  if (
    /create|add|insert|register|subscribe|invite|send|post/.test(
      value
    )
  ) {
    return "create";
  }

  if (
    /update|edit|modify|change|set|toggle|patch|put/.test(
      value
    )
  ) {
    return "update";
  }

  return fallback || "view";
}

function handlerAction(name, fallback) {
  if (name === "GET" || name === "HEAD") return "view";
  if (name === "POST") {
    return fallback === "approve"
      ? "approve"
      : "create";
  }
  if (name === "PUT" || name === "PATCH") {
    return fallback === "approve"
      ? "approve"
      : "update";
  }
  if (name === "DELETE") return "delete";

  return inferAction(name, fallback);
}

function patchFunctions(source, target) {
  const patched = [];

  const functionPattern =
    /export\s+async\s+function\s+([A-Za-z_$][\w$]*)\s*\(([\s\S]*?)\)\s*(?::\s*[^{=]+)?\s*\{/g;

  source = source.replace(
    functionPattern,
    (match, functionName, _args, offset) => {
      const next = source.slice(
        offset + match.length,
        offset + match.length + 260
      );

      if (
        next.includes("requireSuperAdminAccess(") ||
        next.includes("requireAuthenticatedAccess(") ||
        next.includes("requireAnyModulePermission(") ||
        next.includes("requireAnyActionPermission(")
      ) {
        patched.push({
          name: functionName,
          status: "already_guarded",
        });

        return match;
      }

      let guardLine = "";

      if (target.guard === "super_admin") {
        guardLine =
          "\n  await requireSuperAdminAccess();";
      } else if (target.guard === "authenticated") {
        guardLine =
          "\n  await requireAuthenticatedAccess();";
      } else {
        const action = handlerAction(
          functionName,
          target.defaultAction
        );

        const modules = JSON.stringify(
          target.modules || []
        );

        guardLine =
          action === "view"
            ? `\n  await requireAnyModulePermission(${modules}, "view");`
            : `\n  await requireAnyActionPermission(${modules}, "${action}");`;
      }

      patched.push({
        name: functionName,
        status: "patched",
      });

      return match + guardLine;
    }
  );

  const arrowPattern =
    /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*async\s*\(([\s\S]*?)\)\s*(?::\s*[^=]+)?=>\s*\{/g;

  source = source.replace(
    arrowPattern,
    (match, functionName) => {
      let guardLine = "";

      if (target.guard === "super_admin") {
        guardLine =
          "\n  await requireSuperAdminAccess();";
      } else if (target.guard === "authenticated") {
        guardLine =
          "\n  await requireAuthenticatedAccess();";
      } else {
        const action = handlerAction(
          functionName,
          target.defaultAction
        );

        const modules = JSON.stringify(
          target.modules || []
        );

        guardLine =
          action === "view"
            ? `\n  await requireAnyModulePermission(${modules}, "view");`
            : `\n  await requireAnyActionPermission(${modules}, "${action}");`;
      }

      patched.push({
        name: functionName,
        status: "patched_arrow",
      });

      return match + guardLine;
    }
  );

  return { source, patched };
}

for (const target of TARGETS) {
  const filePath = path.join(ROOT, target.file);

  if (!fs.existsSync(filePath)) {
    report.push({
      file: target.file,
      status: "missing",
      functions: [],
    });

    console.log("⚠️ Introuvable :", target.file);
    continue;
  }

  let source = fs.readFileSync(filePath, "utf8");

  if (
    source.includes("requireSuperAdminAccess(") ||
    source.includes("requireAuthenticatedAccess(") ||
    source.includes("requireAnyActionPermission(") ||
    source.includes("requireAnyModulePermission(")
  ) {
    report.push({
      file: target.file,
      status: "already_guarded",
      functions: [],
    });

    console.log("ℹ️ Déjà protégé :", target.file);
    continue;
  }

  backup(filePath);

  if (target.guard === "super_admin") {
    source = addImport(
      source,
      'import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";\n',
      "requireSuperAdminAccess"
    );
  } else if (target.guard === "authenticated") {
    source = addImport(
      source,
      'import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";\n',
      "requireAuthenticatedAccess"
    );
  } else {
    source = addImport(
      source,
      'import { requireAnyActionPermission } from "@/lib/security/secureAction";\nimport { requireAnyModulePermission } from "@/lib/security/routeGuard";\n',
      "requireAnyActionPermission"
    );
  }

  const result = patchFunctions(source, target);

  if (result.patched.length === 0) {
    report.push({
      file: target.file,
      status: "manual_required",
      functions: [],
    });

    console.log(
      "❌ Aucun export asynchrone reconnu :",
      target.file
    );
    continue;
  }

  fs.writeFileSync(filePath, result.source, "utf8");

  report.push({
    file: target.file,
    status: "patched",
    functions: result.patched,
  });

  console.log("✅ Protégé :", target.file);
}

fs.writeFileSync(
  path.join(ROOT, "phase35e2c-patch-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

const manual = report.filter(
  (item) =>
    item.status === "manual_required" ||
    item.status === "missing"
);

const markdown = [
  "# Rapport Phase 35E-2C",
  "",
  ...report.map(
    (item) =>
      `- ${item.file} — ${item.status} — ${(item.functions || []).length} fonction(s)`
  ),
  "",
  "## Vérifications manuelles",
  "",
  ...(manual.length
    ? manual.map(
        (item) => `- ${item.file} — ${item.status}`
      )
    : ["- Aucune"]),
];

fs.writeFileSync(
  path.join(ROOT, "PHASE35E2C_PATCH_REPORT.md"),
  markdown.join("\n"),
  "utf8"
);

console.log("");
console.log("Rapport : PHASE35E2C_PATCH_REPORT.md");
