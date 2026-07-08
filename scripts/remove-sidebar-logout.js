const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src", "components", "layout", "Sidebar.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Fichier introuvable :", filePath);
  process.exit(1);
}

let source = fs.readFileSync(filePath, "utf8");

// 1) Retirer LogOut de l'import lucide-react si présent.
source = source.replace(/,\s*LogOut/g, "");
source = source.replace(/LogOut,\s*/g, "");

// 2) Supprimer le bloc session / déconnexion du bas de la sidebar.
source = source.replace(
  /\n\s*\{!collapsed && \(\s*<div className="mt-3 rounded-2xl border border-\[#DCEAF5\] bg-\[#F8FBFD\] p-3">\s*<p className="text-xs font-black uppercase tracking-wide text-slate-400">\s*Session\s*<\/p>\s*<Link\s*href="\/logout"\s*className="mt-2 flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-red-600"\s*>\s*<LogOut className="h-4 w-4" \/>\s*Déconnexion\s*<\/Link>\s*<\/div>\s*\)}\s*/s,
  "\n"
);

// 3) Variante si le bloc a été légèrement formaté différemment.
source = source.replace(
  /\n\s*\{!collapsed && \(\s*<div[\s\S]*?<p[\s\S]*?Session[\s\S]*?<Link[\s\S]*?href="\/logout"[\s\S]*?Déconnexion[\s\S]*?<\/div>\s*\)}\s*(?=<\/div>\s*<\/aside>)/,
  "\n"
);

fs.writeFileSync(filePath, source, "utf8");

console.log("Déconnexion supprimée de la sidebar :", filePath);
