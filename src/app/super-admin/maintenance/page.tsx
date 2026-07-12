import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  LayoutTemplate,
  Smartphone,
  Wrench,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";

const checks = [
  {
    title: "Layouts",
    description: "Aucune page interne ne doit sortir de AppShell ou SuperAdminShell.",
    icon: LayoutTemplate,
  },
  {
    title: "États vides",
    description: "Chaque liste doit afficher un message clair lorsqu’il n’y a aucune donnée.",
    icon: ClipboardList,
  },
  {
    title: "Erreurs",
    description: "Les erreurs Supabase doivent afficher un message propre et non casser la page.",
    icon: FileWarning,
  },
  {
    title: "Mobile",
    description: "Les tableaux critiques doivent avoir une version cartes sur mobile.",
    icon: Smartphone,
  },
  {
    title: "Modules",
    description: "Les modules activés doivent apparaître et les modules désactivés disparaître.",
    icon: Activity,
  },
  {
    title: "Maintenance",
    description: "Supprimer les fichiers .bak et scripts temporaires inutiles après validation.",
    icon: Wrench,
  },
];

export default async function SuperAdminMaintenancePage() {
  await requireSuperAdmin();

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Stabilisation"
          title="Maintenance de la plateforme"
          description="Suivez les contrôles essentiels pour garder Mpangi-church stable, propre et facile à maintenir."
          icon={CheckCircle2}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => {
            const Icon = check.icon;

            return (
              <article
                key={check.title}
                className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-lg font-black text-[#03357A]">
                  {check.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {check.description}
                </p>
              </article>
            );
          })}
        </section>

        <SectionCard
          title="Commandes de contrôle"
          description="À lancer localement avant chaque déploiement important."
        >
          <div className="space-y-3 text-sm font-bold text-slate-700">
            <pre className="overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-white">
              node scripts/audit-page-stability.js
            </pre>
            <pre className="overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-white">
              node scripts/patch-common-page-backgrounds.js
            </pre>
            <pre className="overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-white">
              node scripts/cleanup-maintenance-temp-files.js
            </pre>
            <pre className="overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-white">
              npm run build
            </pre>
          </div>
        </SectionCard>
      </div>
    </SuperAdminShell>
  );
}
