const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function writeWithBackup(relativePath, content) {
  const filePath = path.join(ROOT, relativePath);
  const dir = path.dirname(filePath);

  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.phase28.bak`;
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }
  }

  fs.writeFileSync(filePath, content, "utf8");

  return relativePath;
}

function patchBackground(relativePath) {
  const filePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(filePath)) {
    return {
      file: relativePath,
      status: "missing",
      changes: 0,
    };
  }

  let source = fs.readFileSync(filePath, "utf8");
  const original = source;
  let changes = 0;

  const replacements = [
    [/bg-black/g, "bg-[#F5F9FC]"],
    [/bg-\[#000\]/g, "bg-[#F5F9FC]"],
    [/bg-slate-950/g, "bg-[#F5F9FC]"],
    [/bg-neutral-950/g, "bg-[#F5F9FC]"],
    [/bg-zinc-950/g, "bg-[#F5F9FC]"],
    [/text-white/g, "text-[#0F172A]"],
    [/text-slate-100/g, "text-slate-700"],
    [/text-slate-200/g, "text-slate-700"],
    [/border-white\/10/g, "border-[#DCEAF5]"],
    [/bg-white\/5/g, "bg-white"],
    [/bg-white\/10/g, "bg-white"],
  ];

  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, () => {
      changes += 1;
      return replacement;
    });
  }

  if (source !== original) {
    const backupPath = `${filePath}.phase28-bg.bak`;
    if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, source, "utf8");
    return {
      file: relativePath,
      status: "patched",
      changes,
    };
  }

  return {
    file: relativePath,
    status: "unchanged",
    changes: 0,
  };
}

const redirectPages = [
  {
    file: "src/app/page.tsx",
    target: "/dashboard",
    reason: "Root route redirects to dashboard.",
  },
  {
    file: "src/app/account/profile/page.tsx",
    target: "/profile",
    reason: "Legacy account profile redirects to the stable profile page.",
  },
  {
    file: "src/app/account/security/page.tsx",
    target: "/profile/password",
    reason: "Legacy security page redirects to password page.",
  },
  {
    file: "src/app/super-admin/page.tsx",
    target: "/super-admin/dashboard",
    reason: "Super admin root redirects to dashboard.",
  },
  {
    file: "src/app/super-admin/users/new/page.tsx",
    target: "/super-admin/settings/users/new",
    reason: "Legacy super admin user creation redirects to settings user creation.",
  },
];

const redirectTemplate = (target, reason) => `import { redirect } from "next/navigation";

export default function RedirectPage() {
  // ${reason}
  redirect("${target}");
}
`;

const redirectResults = redirectPages.map((page) => ({
  file: writeWithBackup(page.file, redirectTemplate(page.target, page.reason)),
  target: page.target,
}));

const backgroundTargets = [
  "src/app/church/[slug]/teachings/page.tsx",
  "src/app/church/[slug]/teachings/[id]/page.tsx",
  "src/app/teachings/page.tsx",
  "src/app/teachings/[id]/page.tsx",
];

const backgroundResults = backgroundTargets.map(patchBackground);

const report = [
  "# Phase 28 — Correction pages critiques",
  "",
  `Date: ${new Date().toISOString()}`,
  "",
  "## Redirections stabilisées",
  "",
  "| Fichier | Redirection |",
  "|---|---|",
  ...redirectResults.map((row) => `| \`${row.file}\` | \`${row.target}\` |`),
  "",
  "## Fonds enseignements corrigés",
  "",
  "| Fichier | Statut | Changements |",
  "|---|---|---:|",
  ...backgroundResults.map(
    (row) => `| \`${row.file}\` | ${row.status} | ${row.changes} |`
  ),
  "",
  "## À faire ensuite",
  "",
  "1. `npm run build`",
  "2. `node scripts/audit-page-stability.js`",
  "3. Vérifier que les 9 pages critiques ont disparu ou diminué fortement.",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "PHASE28_CRITICAL_PAGES_REPORT.md"), report, "utf8");

console.log("");
console.log("Phase 28 appliquée.");
console.log("Rapport : PHASE28_CRITICAL_PAGES_REPORT.md");
console.log("");
console.log("Redirections :");
for (const row of redirectResults) {
  console.log(`- ${row.file} -> ${row.target}`);
}
console.log("");
console.log("Fonds enseignements :");
for (const row of backgroundResults) {
  console.log(`- ${row.status.padEnd(9)} ${String(row.changes).padStart(3)} ${row.file}`);
}
