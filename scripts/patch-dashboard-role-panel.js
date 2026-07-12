const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const dashboardPath = path.join(ROOT, "src", "app", "dashboard", "page.tsx");

if (!fs.existsSync(dashboardPath)) {
  console.log("src/app/dashboard/page.tsx introuvable. Utilise /dashboard/role directement.");
  process.exit(0);
}

let source = fs.readFileSync(dashboardPath, "utf8");
const original = source;

if (!source.includes("@/components/dashboard/RoleDashboardPanel")) {
  const imports = [...source.matchAll(/^import .*?;$/gm)];
  const lastImport = imports[imports.length - 1];

  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    source =
      source.slice(0, insertAt) +
      '\nimport RoleDashboardPanel from "@/components/dashboard/RoleDashboardPanel";' +
      source.slice(insertAt);
  } else {
    source = 'import RoleDashboardPanel from "@/components/dashboard/RoleDashboardPanel";\n' + source;
  }
}

if (!source.includes("<RoleDashboardPanel")) {
  const marker = "</main>";

  if (source.includes(marker)) {
    source = source.replace(marker, "      <RoleDashboardPanel />\n\n" + marker);
  } else {
    const returnMatch = source.lastIndexOf("</");
    if (returnMatch !== -1) {
      source = source.slice(0, returnMatch) + "\n      <RoleDashboardPanel />\n" + source.slice(returnMatch);
    } else {
      console.log("Structure dashboard non reconnue. Utilise /dashboard/role directement.");
      process.exit(0);
    }
  }
}

if (source !== original) {
  const backupPath = `${dashboardPath}.phase33-role-dashboard.bak`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(dashboardPath, backupPath);
  fs.writeFileSync(dashboardPath, source, "utf8");
  console.log("Dashboard principal patché avec RoleDashboardPanel.");
  console.log("Backup :", path.relative(ROOT, backupPath));
} else {
  console.log("Dashboard principal déjà configuré.");
}
