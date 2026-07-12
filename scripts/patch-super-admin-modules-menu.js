const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const candidates = [
  path.join(ROOT, "src", "components", "layout", "SuperAdminShell.tsx"),
  path.join(ROOT, "src", "components", "layout", "SuperAdminSidebar.tsx"),
  path.join(ROOT, "src", "app", "super-admin", "layout.tsx"),
];

const targetPath = candidates.find((file) => fs.existsSync(file));

if (!targetPath) {
  console.log("Aucun fichier shell super admin trouvé. La route /super-admin/modules est disponible directement.");
  process.exit(0);
}

let source = fs.readFileSync(targetPath, "utf8");
const original = source;

if (source.includes("/super-admin/modules")) {
  console.log("Lien modules déjà présent dans", path.relative(ROOT, targetPath));
  process.exit(0);
}

const linkSnippet = `
              <Link
                href="/super-admin/modules"
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              >
                Modules
              </Link>
`;

if (!source.includes("next/link")) {
  source = `import Link from "next/link";\n` + source;
}

const insertionMarkers = [
  "</nav>",
  "</aside>",
];

let patched = false;

for (const marker of insertionMarkers) {
  const idx = source.indexOf(marker);
  if (idx !== -1) {
    source = source.slice(0, idx) + linkSnippet + "\n" + source.slice(idx);
    patched = true;
    break;
  }
}

if (!patched) {
  console.log("Structure shell non reconnue. Utilise directement /super-admin/modules.");
  process.exit(0);
}

const backupPath = `${targetPath}.modules-menu.bak`;
if (!fs.existsSync(backupPath)) fs.copyFileSync(targetPath, backupPath);
fs.writeFileSync(targetPath, source, "utf8");

console.log("Lien /super-admin/modules ajouté dans", path.relative(ROOT, targetPath));
console.log("Backup :", path.relative(ROOT, backupPath));
