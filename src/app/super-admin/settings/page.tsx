import Link from "next/link";
import {
  Building2,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
  Boxes,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";

const cards = [
  {
    title: "Utilisateurs plateforme",
    description: "Gérer les comptes super admin, église et rôles globaux.",
    href: "/super-admin/users",
    icon: UsersRound,
  },
  {
    title: "Créer un utilisateur",
    description: "Créer un compte super admin ou un compte rattaché à une église.",
    href: "/super-admin/users/new",
    icon: UserPlus,
  },
  {
    title: "Églises",
    description: "Ajouter, modifier ou archiver les églises de la plateforme.",
    href: "/super-admin/churches",
    icon: Building2,
  },
  {
    title: "Modules",
    description: "Activer ou désactiver les modules par église.",
    href: "/super-admin/modules",
    icon: Boxes,
  },
];

export default function SuperAdminSettingsPage() {
  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Settings className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Super admin
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">
                Paramètres plateforme
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Les utilisateurs sont regroupés ici pour garder le menu principal plus simple.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#03357A]/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] transition group-hover:bg-[#03357A] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-lg font-black text-[#03357A]">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#03357A]">
                Menu simplifié
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Les actions de gestion des utilisateurs restent accessibles depuis cette page, sans apparaître comme un menu principal séparé.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}
