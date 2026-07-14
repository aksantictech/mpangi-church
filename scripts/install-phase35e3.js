const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function backup(filePath, suffix) {
  const backupPath = `${filePath}.${suffix}.bak`;
  if (fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function patchNavigation() {
  const filePath = path.join(ROOT, "src/lib/security/permissionNavigation.ts");
  if (!fs.existsSync(filePath)) return console.log("⚠️ permissionNavigation.ts introuvable.");

  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes('href: "/settings/security-audit"')) return console.log("ℹ️ Journal sécurité déjà présent.");

  const marker = `  {
    code: "security",
    label: "Rôles et accès",
    href: "/settings/roles",
    category: "configuration",
  },`;

  if (!source.includes(marker)) return console.log("⚠️ Point d’insertion navigation non reconnu.");

  backup(filePath, "phase35e3");
  source = source.replace(marker, `${marker}
  {
    code: "security",
    label: "Journal sécurité",
    href: "/settings/security-audit",
    category: "configuration",
  },`);
  fs.writeFileSync(filePath, source, "utf8");
  console.log("✅ Journal sécurité ajouté au menu filtré.");
}

function patchRouteMap() {
  const filePath = path.join(ROOT, "src/lib/security/routePermissionMap.ts");
  if (!fs.existsSync(filePath)) return console.log("⚠️ routePermissionMap.ts introuvable.");

  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes('id: "settings-security-audit"')) return console.log("ℹ️ Route déjà cartographiée.");

  const marker = `  {
    id: "settings-roles",
    pattern: /^\\/settings\\/roles(?:\\/|$)/,
    modules: ["security"],
    action: "view",
  },`;

  if (!source.includes(marker)) return console.log("⚠️ Point d’insertion route non reconnu.");

  backup(filePath, "phase35e3");
  source = source.replace(marker, `  {
    id: "settings-security-audit",
    pattern: /^\\/settings\\/security-audit(?:\\/|$)/,
    modules: ["security"],
    action: "view",
  },
${marker}`);
  fs.writeFileSync(filePath, source, "utf8");
  console.log("✅ Route journal sécurité cartographiée.");
}

function patchRouteGuard() {
  const filePath = path.join(ROOT, "src/lib/security/routeGuard.ts");
  if (!fs.existsSync(filePath)) return console.log("⚠️ routeGuard.ts introuvable.");

  let source = fs.readFileSync(filePath, "utf8");
  if (source.includes("recordSecurityEvent")) return console.log("ℹ️ Journalisation déjà présente.");

  const importMarker = 'import { redirect } from "next/navigation";';
  if (!source.includes(importMarker)) return console.log("⚠️ Import redirect non reconnu.");

  backup(filePath, "phase35e3");
  source = source.replace(
    importMarker,
    `${importMarker}
import { recordSecurityEvent } from "@/lib/security/securityAudit";`
  );

  const markers = [
    {
      old: `  if (!allowed) {
    redirect(
      \`/unauthorized?reason=module_access&modules=\${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=\${encodeURIComponent(action)}\`
    );
  }`,
      next: `  if (!allowed) {
    await recordSecurityEvent({
      action: "permission.denied",
      resourceType: "module",
      status: "denied",
      severity: "high",
      metadata: { modules: moduleCodes, permissionAction: action, mode: "any" },
    });

    redirect(
      \`/unauthorized?reason=module_access&modules=\${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=\${encodeURIComponent(action)}\`
    );
  }`,
    },
    {
      old: `  if (!allowed) {
    redirect(
      \`/unauthorized?reason=module_access_all&modules=\${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=\${encodeURIComponent(action)}\`
    );
  }`,
      next: `  if (!allowed) {
    await recordSecurityEvent({
      action: "permission.denied",
      resourceType: "module",
      status: "denied",
      severity: "high",
      metadata: { modules: moduleCodes, permissionAction: action, mode: "all" },
    });

    redirect(
      \`/unauthorized?reason=module_access_all&modules=\${encodeURIComponent(
        moduleCodes.join(",")
      )}&action=\${encodeURIComponent(action)}\`
    );
  }`,
    },
  ];

  let changed = false;
  for (const item of markers) {
    if (source.includes(item.old)) {
      source = source.replace(item.old, item.next);
      changed = true;
    }
  }

  if (!changed) return console.log("⚠️ Blocs routeGuard non reconnus.");

  fs.writeFileSync(filePath, source, "utf8");
  console.log("✅ Refus de permissions journalisés.");
}

patchNavigation();
patchRouteMap();
patchRouteGuard();

console.log("");
console.log("✅ Phase 35E-3 installée.");
