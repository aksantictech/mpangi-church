import {
  CheckCircle2,
  LayoutDashboard,
  Menu,
  Smartphone,
  Table2,
  TextCursorInput,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/security/access";

const checks = [
  {
    title: "Dashboard mobile",
    description: "Les cartes KPI doivent tenir sur une colonne ou deux colonnes maximum.",
    icon: LayoutDashboard,
  },
  {
    title: "Tables en cartes",
    description: "Les listes membres, finances, patrimoine et admin doivent avoir une vue cartes sur mobile.",
    icon: Table2,
  },
  {
    title: "Formulaires courts",
    description: "Les formulaires longs doivent être découpés en sections lisibles.",
    icon: TextCursorInput,
  },
  {
    title: "Actions visibles",
    description: "Les boutons importants doivent rester accessibles sans scroll horizontal.",
    icon: CheckCircle2,
  },
  {
    title: "Menu mobile",
    description: "Le menu doit afficher uniquement les modules autorisés.",
    icon: Menu,
  },
  {
    title: "PWA Android",
    description: "Tester installation, icône, login, scanner QR et notifications.",
    icon: Smartphone,
  },
];

export default async function SuperAdminMobileChecklistPage() {
  await requireSuperAdmin();

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Stabilisation V1
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">
            Checklist mobile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Contrôle page par page avant le pilote avec 5 églises.
          </p>
        </section>

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

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#03357A]">
            Audit automatique
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Lancez <code>node scripts/audit-mobile-pages.js</code> pour générer le rapport
            <code> MOBILE_PAGE_AUDIT_REPORT.md</code>. Ce rapport donne les pages à corriger en priorité.
          </p>
        </section>
      </div>
    </SuperAdminShell>
  );
}
