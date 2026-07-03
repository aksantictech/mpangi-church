import Link from "next/link";
import {
  Building2,
  ChevronRight,
  GraduationCap,
  Settings,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const settingsItems = [
  {
    title: "Formations",
    description:
      "Créer les formations personnalisées de chaque église : PCNC, fondements, baptême, leadership...",
    href: "/settings/trainings",
    icon: GraduationCap,
  },
  {
    title: "Départements",
    description:
      "Configurer les départements de service : louange, accueil, jeunesse, intercession...",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Utilisateurs",
    description:
      "Gérer les responsables, ouvriers et accès à l’espace d’administration.",
    href: "/settings/users",
    icon: Users,
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <Settings className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Paramètres
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Configuration de l’église
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                Configurez les éléments propres à chaque église.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#03357A]" />
                </div>

                <h2 className="mt-5 text-xl font-extrabold text-[#03357A]">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}