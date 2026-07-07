import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  Gauge,
  LayoutGrid,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SettingCard = {
  title: string;
  description: string;
  href: string;
  icon: any;
  badge?: string;
};

async function requireSuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.status && profile.status !== "active") redirect("/login");
  if (profile.role !== "super_admin") redirect("/dashboard");

  return profile;
}

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();

  const admin = createAdminClient();

  const [
    { count: churchesCount },
    { count: activeChurchesCount },
    { count: usersCount },
    { count: modulesCount },
    { count: enabledModulesCount },
  ] = await Promise.all([
    admin.from("churches").select("*", { count: "exact", head: true }),
    admin
      .from("churches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("app_modules").select("*", { count: "exact", head: true }),
    admin
      .from("church_modules")
      .select("*", { count: "exact", head: true })
      .eq("enabled", true),
  ]);

  const platformCards: SettingCard[] = [
    {
      title: "Dashboard plateforme",
      description:
        "Vue globale des églises, utilisateurs, membres et activité de la plateforme.",
      href: "/super-admin/dashboard",
      icon: Gauge,
      badge: "Vue globale",
    },
    {
      title: "Églises",
      description:
        "Créer, modifier, archiver et consulter les espaces églises.",
      href: "/super-admin/churches",
      icon: Building2,
      badge: `${churchesCount ?? 0} église(s)`,
    },
    {
      title: "Utilisateurs",
      description:
        "Gérer les comptes, les rôles, les accès et les rattachements aux églises.",
      href: "/super-admin/users",
      icon: Users,
      badge: `${usersCount ?? 0} profil(s)`,
    },
    {
      title: "Modules par église",
      description:
        "Activer ou désactiver les modules : spirituel, administration, finances et patrimoine.",
      href: "/super-admin/modules",
      icon: LayoutGrid,
      badge: `${enabledModulesCount ?? 0} actifs`,
    },
  ];

  const systemCards: SettingCard[] = [
    {
      title: "Catalogue modules",
      description: "Structure technique des modules disponibles dans Mpangi-church.",
      href: "/super-admin/modules",
      icon: SlidersHorizontal,
      badge: `${modulesCount ?? 0} modules`,
    },
    {
      title: "Sécurité plateforme",
      description: "Contrôler les accès super admin, les rôles et les comptes actifs.",
      href: "/super-admin/users",
      icon: ShieldCheck,
      badge: "Accès",
    },
    {
      title: "Données système",
      description: "Vérifier rapidement l’état des données principales de la plateforme.",
      href: "/super-admin/dashboard",
      icon: Database,
      badge: "Supabase",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Paramètres
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Centre de configuration Super Admin
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Tous les réglages de la plateforme sont centralisés ici :
                églises, utilisateurs, modules et sécurité.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-3xl font-black">{activeChurchesCount ?? 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
                Églises actives
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Églises"
            value={churchesCount ?? 0}
            description="Espaces créés"
            icon={Building2}
          />
          <Metric
            label="Actives"
            value={activeChurchesCount ?? 0}
            description="Espaces opérationnels"
            icon={CheckCircle2}
          />
          <Metric
            label="Utilisateurs"
            value={usersCount ?? 0}
            description="Profils enregistrés"
            icon={Users}
          />
          <Metric
            label="Modules actifs"
            value={enabledModulesCount ?? 0}
            description="Activations par église"
            icon={LayoutGrid}
          />
        </section>

        <SettingsSection
          title="Administration plateforme"
          description="Raccourcis principaux pour gérer toute la plateforme."
          cards={platformCards}
        />

        <SettingsSection
          title="Configuration système"
          description="Réglages techniques et contrôle de cohérence."
          cards={systemCards}
        />
      </div>
    </AppShell>
  );
}

function SettingsSection({
  title,
  description,
  cards,
}: {
  title: string;
  description: string;
  cards: SettingCard[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-[#03357A]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href + card.title}
              href={card.href}
              className="group flex min-h-56 flex-col justify-between rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                    <Icon className="h-7 w-7" />
                  </div>

                  {card.badge && (
                    <span className="rounded-full bg-[#F1E8FF] px-3 py-1 text-xs font-extrabold text-[#8B5CF6]">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-[#03357A]">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#2563EB]">
                Ouvrir
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: any;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
