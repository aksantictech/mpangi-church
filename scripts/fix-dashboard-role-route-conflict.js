const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const wrongApiPage = path.join(
  ROOT,
  "src",
  "app",
  "api",
  "dashboard",
  "role",
  "page.tsx"
);

const correctPageDir = path.join(ROOT, "src", "app", "dashboard", "role");
const correctPage = path.join(correctPageDir, "page.tsx");

const correctPageContent = `import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import RoleDashboardPanel from "@/components/dashboard/RoleDashboardPanel";

export default function RoleDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard principal
        </Link>

        <PageHeader
          eyebrow="Dashboard rôle"
          title="Tableau de bord personnalisé"
          description="Les indicateurs et raccourcis sont adaptés au rôle de l’utilisateur connecté."
          icon={LayoutDashboard}
        />

        <RoleDashboardPanel />
      </div>
    </AppShell>
  );
}
`;

console.log("");
console.log("Correction conflit /api/dashboard/role");
console.log("");

if (fs.existsSync(wrongApiPage)) {
  const backupPath = `${wrongApiPage}.wrong-location.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(wrongApiPage, backupPath);
  }

  fs.rmSync(wrongApiPage, { force: true });

  console.log("Supprimé :", path.relative(ROOT, wrongApiPage));
  console.log("Backup  :", path.relative(ROOT, backupPath));
} else {
  console.log("Aucun mauvais fichier page.tsx trouvé dans src/app/api/dashboard/role.");
}

fs.mkdirSync(correctPageDir, { recursive: true });

if (!fs.existsSync(correctPage)) {
  fs.writeFileSync(correctPage, correctPageContent, "utf8");
  console.log("Créé    :", path.relative(ROOT, correctPage));
} else {
  console.log("OK      :", path.relative(ROOT, correctPage));
}

const apiRoute = path.join(ROOT, "src", "app", "api", "dashboard", "role", "route.ts");

if (!fs.existsSync(apiRoute)) {
  console.warn("");
  console.warn("Attention : src/app/api/dashboard/role/route.ts est introuvable.");
  console.warn("Il faut garder route.ts pour l'API /api/dashboard/role.");
} else {
  console.log("OK      :", path.relative(ROOT, apiRoute));
}

console.log("");
console.log("Terminé. Relance maintenant : npm run build");
