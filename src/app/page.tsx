import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Church,
  ClipboardList,
  Database,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  Network,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PublicChurch = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
};

async function getPublicChurches(): Promise<PublicChurch[]> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("churches")
      .select("id, name, slug, logo_url, city, country, status")
      .neq("status", "archived")
      .order("name", { ascending: true })
      .limit(12);

    if (error) return [];

    return (data ?? []) as PublicChurch[];
  } catch {
    return [];
  }
}

const features = [
  {
    title: "Membres & suivi pastoral",
    description:
      "Centralisez les membres, nouveaux venus, nouveaux convertis, formations et suivi des âmes.",
    icon: UsersRound,
  },
  {
    title: "Présences QR",
    description:
      "Scannez les présences aux cultes et réunions avec des rapports lisibles par événement.",
    icon: QrCode,
  },
  {
    title: "Extensions",
    description:
      "Suivez les activités hebdomadaires des extensions : participants, conversions, recettes et dépenses.",
    icon: Network,
  },
  {
    title: "Administration",
    description:
      "Gérez courriers, transmissions internes, tâches administratives, réunions et procès-verbaux.",
    icon: ClipboardList,
  },
  {
    title: "Finances",
    description:
      "Suivez entrées, offrandes, dépenses, budgets et rapports financiers par église.",
    icon: Wallet,
  },
  {
    title: "Patrimoine",
    description:
      "Pilotez inventaire, maintenance, mouvements et état du patrimoine de l’église.",
    icon: Warehouse,
  },
];

const steps = [
  "Créer l’église",
  "Configurer le logo et le domaine",
  "Activer les modules",
  "Créer les utilisateurs",
  "Installer la PWA mobile",
  "Suivre les dashboards par rôle",
];

const stats = [
  {
    value: "360°",
    label: "Vue complète",
  },
  {
    value: "PWA",
    label: "Mobile installable",
  },
  {
    value: "Multi",
    label: "Églises séparées",
  },
  {
    value: "QR",
    label: "Présences rapides",
  },
];

function ChurchLogo({ church }: { church: PublicChurch }) {
  if (church.logo_url) {
    return (
      <Image
        src={church.logo_url}
        alt={church.name}
        width={56}
        height={56}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03357A] text-sm font-black text-white">
      {church.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default async function PublicHomePage() {
  const churches = await getPublicChurches();
  const activeChurches = churches.filter(
    (church) => church.status === "active" || !church.status
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#F5F9FC] text-[#0F172A]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes mpangiFloat {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(0, -18px, 0) rotate(2deg); }
            }

            @keyframes mpangiPulse {
              0%, 100% { opacity: .55; transform: scale(1); }
              50% { opacity: .95; transform: scale(1.08); }
            }

            @keyframes mpangiMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }

            .mpangi-float { animation: mpangiFloat 7s ease-in-out infinite; }
            .mpangi-float-delay { animation: mpangiFloat 8.5s ease-in-out infinite; animation-delay: 1.2s; }
            .mpangi-pulse { animation: mpangiPulse 4.8s ease-in-out infinite; }
            .mpangi-marquee { animation: mpangiMarquee 28s linear infinite; }
          `,
        }}
      />

      <header className="sticky top-0 z-50 border-b border-[#DCEAF5] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-13 w-13 items-center justify-center rounded-[1.35rem] bg-[#03357A] text-white shadow-lg shadow-blue-900/20">
              <Church className="h-7 w-7" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#8B5CF6] ring-4 ring-white" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-xl font-black text-[#03357A]">
                Mpangi-church
              </span>
              <span className="block truncate text-xs font-black uppercase tracking-[0.32em] text-slate-400">
                AKSANTIC Technology
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <a href="#modules" className="hover:text-[#03357A]">
              Modules
            </a>
            <a href="#processus" className="hover:text-[#03357A]">
              Processus
            </a>
            <a href="#eglises" className="hover:text-[#03357A]">
              Églises
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/15"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute left-[-9rem] top-[-8rem] h-80 w-80 rounded-full bg-[#8B5CF6]/25 blur-3xl mpangi-pulse" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-[#2563EB]/20 blur-3xl mpangi-pulse" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCEAF5] bg-white px-4 py-2 text-sm font-black text-[#03357A] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              Plateforme intelligente pour églises modernes
            </div>

            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-[1.03] text-[#03357A] sm:text-6xl lg:text-7xl">
                Gérez votre église avec ordre, vision et excellence.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-600">
                Mpangi-church est une plateforme web et mobile pour gérer les
                membres, présences, cellules, extensions, finances, patrimoine,
                administration et dashboards par rôle, avec des espaces séparés
                pour chaque église.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/20"
              >
                Accéder à mon espace
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#eglises"
                className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
              >
                Voir les églises publiques
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm"
                >
                  <p className="text-2xl font-black text-[#03357A]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px]">
            <div className="absolute left-0 top-6 w-[88%] rounded-[2rem] border border-white/30 bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-2xl shadow-blue-900/25 mpangi-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">
                    Dashboard église
                  </p>
                  <h2 className="mt-3 text-2xl font-black">
                    Vue pastorale en temps réel
                  </h2>
                </div>

                <LayoutDashboard className="h-9 w-9" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Membres actifs", "1 240"],
                  ["Présences ce mois", "3 876"],
                  ["Âmes suivies", "84"],
                  ["Extensions", "12"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/15 p-4 backdrop-blur"
                  >
                    <p className="text-xs font-bold text-blue-100">{label}</p>
                    <p className="mt-2 text-3xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute right-0 top-[18rem] w-[74%] rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-2xl shadow-slate-900/10 mpangi-float-delay">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-[#03357A]">
                    Espace privé sécurisé
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    Données séparées par église
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Sous-domaine privé",
                  "Modules activables",
                  "Rôles personnalisés",
                  "PWA avec logo église",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-slate-600">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 left-8 w-[70%] rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#03357A]">
                    Notifications & Bible
                  </p>
                  <p className="text-sm text-slate-500">
                    Communication, enseignements et lecture biblique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-[#DCEAF5] bg-white py-4">
          <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="flex w-[200%] gap-4 mpangi-marquee">
              {[...features, ...features].map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="min-w-[260px] rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-black text-[#03357A]"
                >
                  {feature.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#2563EB]">
            Modules
          </p>
          <h2 className="mt-3 text-4xl font-black text-[#03357A]">
            Tout ce qu’il faut pour piloter une église.
          </h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Une architecture pensée pour les pasteurs, secrétaires, finances,
            responsables de départements, extensions et équipes administratives.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-[2rem] border border-[#DCEAF5] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] transition group-hover:bg-[#03357A] group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-xl font-black text-[#03357A]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="processus" className="bg-[#03357A] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-200">
              Mise en service
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Un onboarding contrôlé pour chaque église.
            </h2>
            <p className="mt-4 text-base leading-8 text-blue-100">
              Chaque nouvelle église est configurée étape par étape : identité,
              logo, modules, utilisateurs, PWA, notifications et validation
              finale.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-sm font-black text-blue-200">
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-black">{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="eglises" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#2563EB]">
                Réseau
              </p>
              <h2 className="mt-3 text-4xl font-black text-[#03357A]">
                Églises déjà présentes
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Liste publique alimentée depuis la base de données. Chaque
                église peut avoir sa page publique, son identité et son espace
                privé séparé.
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
              {activeChurches.length} église(s) active(s)
            </div>
          </div>

          {churches.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {churches.map((church) => (
                <Link
                  key={church.id}
                  href={`/church/${church.slug}`}
                  className="group rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 transition hover:-translate-y-1 hover:border-[#03357A]/30 hover:bg-white hover:shadow-xl hover:shadow-blue-900/10"
                >
                  <div className="flex items-start gap-4">
                    <ChurchLogo church={church} />

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-lg font-black text-[#03357A]">
                        {church.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {church.city || "Ville non renseignée"}
                        {church.country ? ` • ${church.country}` : ""}
                      </p>

                      <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#03357A] ring-1 ring-[#DCEAF5]">
                        Page publique
                      </span>
                    </div>

                    <ArrowRight className="mt-2 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03357A]" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-8 text-center">
              <Database className="mx-auto h-10 w-10 text-[#03357A]" />
              <h3 className="mt-4 text-xl font-black text-[#03357A]">
                Aucune église publique disponible
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Les églises apparaîtront ici dès qu’elles seront créées dans la
                base de données.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#DCEAF5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm font-semibold text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © 2026 Mpangi-church — propulsé par{" "}
            <span className="font-black text-[#03357A]">AKSANTIC Technology</span>
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#modules" className="hover:text-[#03357A]">
              Modules
            </a>
            <a href="#processus" className="hover:text-[#03357A]">
              Processus
            </a>
            <Link href="/login" className="hover:text-[#03357A]">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
