import Link from "next/link";
import type {
  LucideIcon,
} from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  FileSpreadsheet,
  HandCoins,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import {
  canAccessAnyModule,
} from "@/lib/security/routeGuard";

export const dynamic =
  "force-dynamic";

type ReportCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone:
    | "blue"
    | "green"
    | "violet"
    | "amber"
    | "cyan";
  available: boolean;
  label: string;
};

const toneClasses = {
  blue:
    "from-blue-700 to-blue-500 shadow-blue-900/20",
  green:
    "from-emerald-700 to-emerald-500 shadow-emerald-900/20",
  violet:
    "from-violet-700 to-violet-500 shadow-violet-900/20",
  amber:
    "from-amber-600 to-orange-500 shadow-orange-900/20",
  cyan:
    "from-cyan-700 to-sky-500 shadow-cyan-900/20",
};

export default async function ReportsPage() {
  const [
    canViewAttendance,
    canViewFinance,
    canViewExtensions,
    canViewDonations,
    canViewSecurity,
  ] = await Promise.all([
    canAccessAnyModule(
      ["attendance"],
      "view"
    ),

    canAccessAnyModule(
      [
        "finance_reports",
        "financial_reports",
        "finance",
      ],
      "view"
    ),

    canAccessAnyModule(
      [
        "extension_reports",
        "extensions",
      ],
      "view"
    ),

    canAccessAnyModule(
      [
        "donations",
        "finance",
      ],
      "view"
    ),

    canAccessAnyModule(
      [
        "security",
        "settings",
      ],
      "view"
    ),
  ]);

  const cards: ReportCard[] = [
    {
      title:
        "Rapports de présence",
      description:
        "Consultez les présences par événement, les absences, les pointages et exportez les résultats en CSV.",
      href: "/attendance",
      icon: CalendarCheck,
      tone: "blue",
      available:
        canViewAttendance,
      label:
        "Présences et événements",
    },
    {
      title:
        "Rapports financiers",
      description:
        "Analysez les offrandes, dépenses, budgets et soldes sur une période déterminée.",
      href: "/finance/reports",
      icon: Landmark,
      tone: "green",
      available:
        canViewFinance,
      label:
        "Finances",
    },
    {
      title:
        "Rapports des extensions",
      description:
        "Suivez les activités, les implantations et les résultats des différentes extensions de l’église.",
      href: "/extensions/reports",
      icon: Building2,
      tone: "violet",
      available:
        canViewExtensions,
      label:
        "Extensions",
    },
    {
      title:
        "Rapports des dons",
      description:
        "Consultez les dons déclarés, paiements attendus, confirmations et montants collectés.",
      href: "/finance/donations",
      icon: HandCoins,
      tone: "amber",
      available:
        canViewDonations,
      label:
        "Dons et paiements",
    },
    {
      title:
        "Audit de sécurité",
      description:
        "Analysez les accès refusés, erreurs, alertes et opérations sensibles enregistrées.",
      href:
        "/settings/security-audit",
      icon: ShieldCheck,
      tone: "cyan",
      available:
        canViewSecurity,
      label:
        "Sécurité",
    },
  ];

  const availableCards =
    cards.filter(
      (card) =>
        card.available
    );

  if (
    availableCards.length === 0
  ) {
    redirect(
      "/unauthorized?reason=reports_access"
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/20 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BarChart3 className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                Phase 36D
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Centre de rapports
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Retrouvez dans un seul espace les
                rapports autorisés pour votre rôle,
                consultez les indicateurs et exportez
                les données disponibles.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {availableCards.map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex min-w-0 flex-col rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={[
                      "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                      toneClasses[
                        card.tone
                      ],
                    ].join(" ")}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {card.label}
                  </p>

                  <h2 className="mt-2 text-xl font-black text-[#03357A]">
                    {card.title}
                  </h2>

                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {
                      card.description
                    }
                  </p>

                  <span className="mt-5 inline-flex min-h-11 items-center justify-between rounded-2xl bg-[#F4F8FC] px-4 text-sm font-black text-[#03357A] transition group-hover:bg-[#03357A] group-hover:text-white">
                    Ouvrir le rapport
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            }
          )}
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <FileSpreadsheet className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#03357A]">
                Exports sécurisés
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Les exports restent limités à l’église
                de l’utilisateur connecté et aux
                permissions de son rôle. Les rapports
                existants conservent leurs propres
                filtres et formats d’export.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}