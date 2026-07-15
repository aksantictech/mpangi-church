import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Rocket,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";

const apps: Array<{
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    label: "Dashboard",
    description: "Vue globale de la plateforme",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
    accent: "from-blue-700 to-blue-500",
  },
  {
    label: "Églises",
    description: "Gérer les espaces et sous-domaines",
    href: "/super-admin/churches",
    icon: Building2,
    accent: "from-violet-700 to-violet-500",
  },
  {
    label: "Utilisateurs",
    description: "Comptes et affectations",
    href: "/super-admin/users",
    icon: UsersRound,
    accent: "from-emerald-700 to-emerald-500",
  },
  {
    label: "Modules",
    description: "Catalogue et activations",
    href: "/super-admin/modules",
    icon: Boxes,
    accent: "from-cyan-700 to-cyan-500",
  },
  {
    label: "Onboarding",
    description: "Mise en service des églises",
    href: "/super-admin/onboarding",
    icon: Rocket,
    accent: "from-amber-700 to-orange-500",
  },
  {
    label: "Paramètres",
    description: "Configuration globale",
    href: "/super-admin/settings",
    icon: Settings,
    accent: "from-slate-700 to-slate-500",
  },
  {
    label: "Profil",
    description: "Compte Super Admin",
    href: "/super-admin/profile",
    icon: UserRound,
    accent: "from-rose-700 to-pink-500",
  },
  {
    label: "Pré-déploiement",
    description: "Contrôles de production",
    href: "/super-admin/maintenance/predeploy",
    icon: Wrench,
    accent: "from-indigo-700 to-indigo-500",
  },
];

export default function SuperAdminAppsPage() {
  return (
    <SuperAdminShell>
      <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
        <ShieldCheck className="h-8 w-8" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
          Centre de contrôle
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Applications Super Admin
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Une présentation simple, inspirée d’un lanceur d’applications,
          adaptée au mobile comme au desktop.
        </p>
      </section>

      <section
        data-mpangi-module-grid
        className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {apps.map((app) => {
          const Icon = app.icon;

          return (
            <Link
              key={app.href}
              href={app.href}
              className="group flex min-w-0 flex-col items-center rounded-3xl bg-white p-2.5 text-center shadow-sm ring-1 ring-[#DCEAF5] transition hover:-translate-y-1 hover:shadow-lg sm:p-3"
            >
              <span
                className={`flex aspect-square w-full max-w-[88px] items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${app.accent} text-white shadow-md`}
              >
                <Icon className="h-8 w-8" />
              </span>
              <span className="mt-2 line-clamp-2 min-h-[2.5rem] w-full break-words text-[11px] font-black leading-5 text-[#03357A] sm:text-xs">
                {app.label}
              </span>
              <span className="mt-1 hidden line-clamp-2 text-[10px] leading-4 text-slate-500 sm:block">
                {app.description}
              </span>
            </Link>
          );
        })}
      </section>
    </SuperAdminShell>
  );
}
