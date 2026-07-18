import Link from "next/link";
import type {
  LucideIcon,
} from "lucide-react";
import {
  Bell,
  Gift,
  Palette,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type SettingsTone =
  | "blue"
  | "violet"
  | "green"
  | "amber"
  | "red";

type SettingsCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: SettingsTone;
};

const cards: SettingsCard[] = [
  {
    title:
      "Page publique et apparence",
    description:
      "Personnaliser les couleurs, la PWA, les contenus et les sections visibles.",
    href: "/settings/public-page",
    icon: Palette,
    tone: "blue",
  },
  {
    title: "Utilisateurs & rôles",
    description:
      "Créer les comptes, attribuer les modules et limiter les accès.",
    href: "/settings/users",
    icon: UsersRound,
    tone: "violet",
  },
  {
    title: "Créer un utilisateur",
    description:
      "Ajouter rapidement un nouveau compte dans cette église.",
    href: "/settings/users/new",
    icon: UserPlus,
    tone: "violet",
  },
  {
    title:
      "Configuration des dons",
    description:
      "Configurer les moyens de paiement, devises et informations publiques.",
    href: "/settings/donations",
    icon: Gift,
    tone: "green",
  },
  {
    title: "Notifications",
    description:
      "Activer, envoyer et suivre les notifications de l’église.",
    href: "/notifications",
    icon: Bell,
    tone: "amber",
  },
  {
    title: "Sécurité et audit",
    description:
      "Consulter les accès refusés, erreurs et actions sensibles de l’église.",
    href: "/settings/security-audit",
    icon: ShieldAlert,
    tone: "red",
  },
];

const toneClasses: Record<
  SettingsTone,
  string
> = {
  blue:
    "bg-blue-50 text-blue-700 group-hover:bg-blue-700",
  violet:
    "bg-violet-50 text-violet-700 group-hover:bg-violet-700",
  green:
    "bg-green-50 text-green-700 group-hover:bg-green-700",
  amber:
    "bg-amber-50 text-amber-700 group-hover:bg-amber-600",
  red:
    "bg-red-50 text-red-700 group-hover:bg-red-700",
};

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
                Gérez les utilisateurs, les dons, les
                notifications, l’apparence et la
                sécurité sans surcharger le menu
                principal.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group min-w-0 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#03357A]/30 hover:shadow-md"
              >
                <div
                  className={[
                    "flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:text-white",
                    toneClasses[card.tone],
                  ].join(" ")}
                >
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
                Chaque utilisateur voit uniquement les
                modules autorisés selon son rôle ou ses
                permissions personnalisées. Les pages
                sensibles restent protégées côté
                serveur et les opérations importantes
                sont enregistrées dans le journal
                d’audit.
              </p>

              <Link
                href="/settings/security-audit"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 text-sm font-black text-white transition hover:bg-[#022B63]"
              >
                <ShieldAlert className="h-4 w-4" />
                Ouvrir le journal de sécurité
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}