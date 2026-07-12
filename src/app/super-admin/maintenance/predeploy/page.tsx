import Link from "next/link";
import { ArrowLeft, CheckCircle2, TerminalSquare } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { requireSuperAdmin } from "@/lib/security/access";

const commands = [
  {
    label: "Audit pages",
    command: "npm run audit:pages",
  },
  {
    label: "Audit mobile",
    command: "npm run audit:mobile",
  },
  {
    label: "Audit états",
    command: "npm run audit:states",
  },
  {
    label: "Scan nettoyage",
    command: "npm run cleanup:scan",
  },
  {
    label: "Pré-déploiement complet",
    command: "npm run predeploy:build",
  },
];

export default async function SuperAdminPredeployPage() {
  await requireSuperAdmin();

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <Link
          href="/super-admin/maintenance"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour maintenance
        </Link>

        <PageHeader
          eyebrow="Maintenance"
          title="Checklist pré-déploiement"
          description="Commandes à exécuter localement avant chaque push production."
          icon={CheckCircle2}
        />

        <SectionCard
          title="Commandes recommandées"
          description="À lancer dans VS Code depuis la racine du projet."
        >
          <div className="space-y-3">
            {commands.map((item) => (
              <article
                key={item.command}
                className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
              >
                <p className="text-sm font-black text-[#03357A]">
                  {item.label}
                </p>

                <pre className="mt-2 overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-sm font-bold text-white">
                  {item.command}
                </pre>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Rapports générés">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "PAGE_STABILITY_REPORT.md",
              "MOBILE_TABLES_AUDIT_REPORT.md",
              "ROUTE_STATES_COVERAGE_REPORT.md",
              "PREDEPLOY_CHECK_REPORT.md",
            ].map((report) => (
              <div
                key={report}
                className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-black text-[#03357A]"
              >
                <TerminalSquare className="h-5 w-5" />
                {report}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </SuperAdminShell>
  );
}
