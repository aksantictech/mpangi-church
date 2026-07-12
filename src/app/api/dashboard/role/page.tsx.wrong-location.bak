import Link from "next/link";
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
