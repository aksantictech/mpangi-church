const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const targets = [
  "src/app/dashboard/page.tsx",
  "src/app/super-admin/dashboard/page.tsx",
  "src/app/church/[slug]/page.tsx",
  "src/app/attendance/scanner/page.tsx",
  "src/app/notifications/page.tsx",
  "src/app/install/page.tsx",
  "src/components/layout/MobileTopBar.tsx",
  "src/components/layout/ChurchDesktopTopBar.tsx",
  "src/components/public/PublicMobileBottomNav.tsx",
  "src/app/manifest.ts",
  "public/sw.js",
];

const rows = targets.map((relativePath) => {
  const fullPath = path.join(ROOT, relativePath);
  const exists = fs.existsSync(fullPath);
  const source = exists
    ? fs.readFileSync(fullPath, "utf8")
    : "";

  return {
    file: relativePath,
    exists,
    tables: (source.match(/<table\b/g) || []).length,
    fixed: (source.match(/\bfixed\b/g) || []).length,
    absolute: (source.match(/\babsolute\b/g) || []).length,
    largeText: (
      source.match(/\btext-(?:6xl|7xl|8xl|9xl)\b/g) || []
    ).length,
    overflowHidden: (
      source.match(/\boverflow-hidden\b/g) || []
    ).length,
  };
});

console.table(rows);

const report = [
  "# Audit Phase 35D-4",
  "",
  "| Fichier | Existe | Tables | Fixed | Absolute | Grands textes | Overflow hidden |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...rows.map(
    (row) =>
      `| ${row.file} | ${row.exists ? "oui" : "non"} | ${row.tables} | ${row.fixed} | ${row.absolute} | ${row.largeText} | ${row.overflowHidden} |`
  ),
  "",
  "## Tests manuels",
  "",
  "- dashboard église en 360 × 800",
  "- dashboard super admin en 390 × 844",
  "- page publique d’une église",
  "- ouverture du menu supérieur",
  "- scanner QR avec caméra",
  "- notifications longues",
  "- page /install sur Chrome Android",
  "- page /install sur iPhone/iPad",
];

fs.writeFileSync(
  path.join(ROOT, "PHASE35D4_AUDIT_REPORT.md"),
  report.join("\n"),
  "utf8"
);

console.log("");
console.log("Rapport : PHASE35D4_AUDIT_REPORT.md");
