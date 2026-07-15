import Link from "next/link";
import {
  Bell,
  Gift,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const cards = [
  {
    title: "Utilisateurs & rôles",
    description:
      "Créer les comptes, attribuer les modules et limiter les accès.",
    href: "/settings/users",
    icon: UsersRound,
  },
  {
    title: "Créer un utilisateur",
    description:
      "Ajouter rapidement un nouveau compte dans cette église.",
    href: "/settings/users/new",
    icon: UserPlus,
  },
  {
    title: "Configuration des dons",
    description:
      "Configurer Mobile Money, carte, banque, devises et verset biblique.",
    href: "/settings/donations",
    icon: Gift,
  },
  {
    title: "Notifications",
    description:
      "Activer, envoyer et suivre les notifications de l’église.",
    href: "/notifications",
    icon: Bell,
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Settings className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
                Paramètres
              </p>

              <h1 className="mt-3 text-3xl font-black">
                Configuration de l’église
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Gérez les utilisateurs, les dons et les
                notifications sans surcharger le menu principal.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group min-w-0 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#03357A]/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] transition group-hover:bg-[#03357A] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 break-words text-lg font-black text-[#03357A]">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
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
                Principe d’accès
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Chaque utilisateur voit uniquement les modules
                autorisés selon son rôle ou ses permissions
                personnalisées. Les pages sensibles restent
                protégées côté serveur.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
