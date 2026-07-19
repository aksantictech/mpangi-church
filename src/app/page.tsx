import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Globe2,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Network,
  Presentation,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildChurchPublicUrl } from "@/lib/tenant/domain";
import CommercialContactForm from "@/components/public/CommercialContactForm";

export const dynamic = "force-dynamic";

const MPANGI_LOGO_SRC = "/icons/icon-192.png";
const AKSANTIC_URL = "https://aksantictech.com";
const AKSANTIC_EMAIL = "aksantictech@gmail.com";
const AKSANTIC_WHATSAPP = "https://wa.me/243801655726";

type PublicChurch = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
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
      .select("id, name, slug, subdomain, logo_url, city, country, status")
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
    description: "Centralisez les membres, nouveaux venus, nouveaux convertis, formations et suivi des âmes.",
    icon: UsersRound,
  },
  {
    title: "Présences QR",
    description: "Scannez les présences aux cultes et réunions avec des rapports lisibles par événement.",
    icon: QrCode,
  },
  {
    title: "Extensions",
    description: "Suivez les activités hebdomadaires : participants, conversions, recettes et dépenses.",
    icon: Network,
  },
  {
    title: "Administration",
    description: "Gérez courriers, transmissions internes, tâches administratives, réunions et PV.",
    icon: ClipboardList,
  },
  {
    title: "Finances",
    description: "Suivez entrées, offrandes, dépenses, budgets et rapports financiers par église.",
    icon: Wallet,
  },
  {
    title: "Patrimoine",
    description: "Pilotez inventaire, maintenance, mouvements et état du patrimoine de l’église.",
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
  ["360°", "Vue complète"],
  ["PWA", "Mobile installable"],
  ["Multi", "Églises séparées"],
  ["QR", "Présences rapides"],
];

function ChurchLogo({ church }: { church: PublicChurch }) {
  if (church.logo_url) {
    return (
      <img
        src={church.logo_url}
        alt={church.name}
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
    <main id="top" data-mpangi-global-home className="min-h-screen overflow-hidden bg-[#F5F9FC] pb-20 text-[#0F172A] lg:pb-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes mpangiFloat {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
              50% { transform: translate3d(0, -12px, 0) rotate(1.2deg); }
            }
            @keyframes mpangiPulse {
              0%, 100% { opacity: .45; transform: scale(1); }
              50% { opacity: .75; transform: scale(1.05); }
            }
            @keyframes mpangiMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .mpangi-float { animation: mpangiFloat 9s ease-in-out infinite; }
            .mpangi-float-delay { animation: mpangiFloat 10s ease-in-out infinite; animation-delay: 1.2s; }
            .mpangi-pulse { animation: mpangiPulse 6s ease-in-out infinite; }
            .mpangi-marquee { animation: mpangiMarquee 32s linear infinite; }
            @media (prefers-reduced-motion: reduce) {
              .mpangi-float, .mpangi-float-delay, .mpangi-pulse, .mpangi-marquee {
                animation: none !important;
              }
            }
          `,
        }}
      />

      <header className="sticky top-0 z-50 border-b border-[#DCEAF5] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href={AKSANTIC_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3"
            title="Visiter AKSANTIC Technology"
          >
            <span className="relative flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-white shadow-lg shadow-blue-900/20 ring-1 ring-[#DCEAF5]">
              <img
                src={MPANGI_LOGO_SRC}
                alt="Logo Mpangi-church"
                className="h-12 w-12 rounded-2xl object-contain"
              />
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
          </a>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <a href="#modules" className="hover:text-[#03357A]">Modules</a>
            <a href="#avantages" className="hover:text-[#03357A]">Avantages</a>
            <Link href="/pricing" className="hover:text-[#03357A]">Forfaits</Link>
            <a href="#processus" className="hover:text-[#03357A]">Processus</a>
            <a href="#eglises" className="hover:text-[#03357A]">Églises</a>
            <a href="#demo" className="hover:text-[#03357A]">Démo & devis</a>
            <a href="#contact" className="hover:text-[#03357A]">Contact</a>
          </nav>

          <Link
            href="/login"
            className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/15"
          >
            Connexion
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="absolute left-[-9rem] top-[-8rem] h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl mpangi-pulse" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-[#2563EB]/15 blur-3xl mpangi-pulse" />

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
              <a
                href="#demo"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/20"
              >
                <Presentation className="h-4 w-4" />
                Demander une démo
              </a>

              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
              >
                Accéder à mon espace
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-violet-50 px-6 py-4 text-sm font-black text-violet-700 ring-1 ring-violet-100"
              >
                Voir les forfaits
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <article key={label} className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm">
                  <p className="text-2xl font-black text-[#03357A]">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px]">
            <div className="absolute left-0 top-6 w-[88%] rounded-[2rem] border border-white/30 bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-2xl shadow-blue-900/25 mpangi-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">Dashboard église</p>
                  <h2 className="mt-3 text-2xl font-black">Vue pastorale en temps réel</h2>
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
                  <div key={label} className="rounded-2xl bg-white/15 p-4 backdrop-blur">
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
                  <h3 className="font-black text-[#03357A]">Espace privé sécurisé</h3>
                  <p className="text-sm font-semibold text-slate-500">Données séparées par église</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {["Sous-domaine privé", "Modules activables", "Rôles personnalisés", "PWA avec logo église"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-slate-600">{item}</span>
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
                  <p className="text-sm font-black text-[#03357A]">Notifications & Bible</p>
                  <p className="text-sm text-slate-500">Communication, enseignements et lecture biblique.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-[#DCEAF5] bg-white py-4">
          <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="flex w-max min-w-max gap-4 mpangi-marquee">
              {[...features, ...features].map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="w-[260px] shrink-0 rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-black text-[#03357A]"
                >
                  {feature.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="avantages" className="border-y border-[#DCEAF5] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#8B5CF6]">Pourquoi Mpangi-Church ?</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-[#03357A]">Plus de temps pour la mission, moins de tâches dispersées.</h2>
            </div>
            <p className="text-base leading-8 text-slate-600">
              Une solution conçue avec les réalités des églises africaines : utilisation mobile, espaces séparés, accompagnement humain et modules activables selon votre organisation.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [ShieldCheck, "Sécurisé", "Données et accès séparés pour chaque église."],
              [Rocket, "Rapide à déployer", "Configuration, formation et mise en service accompagnées."],
              [Globe2, "Accessible partout", "Web, mobile et application PWA installable."],
              [HeartHandshake, "Adapté à votre église", "Modules, rôles, identité et page publique personnalisables."],
            ].map(([Icon, title, description]) => {
              const BenefitIcon = Icon as typeof ShieldCheck;
              return (
                <article key={String(title)} className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-sm">
                    <BenefitIcon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#03357A]">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{String(description)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#2563EB]">Modules</p>
          <h2 className="mt-3 text-4xl font-black text-[#03357A]">Tout ce qu’il faut pour piloter une église.</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Une architecture pensée pour les pasteurs, secrétaires, finances, responsables de départements, extensions et équipes administratives.
          </p>
        </div>

        <div data-mpangi-global-modules-grid className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="group rounded-[2rem] border border-[#DCEAF5] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A] transition group-hover:bg-[#03357A] group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#03357A]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="processus" className="bg-[#03357A] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-200">Mise en service</p>
            <h2 className="mt-3 text-4xl font-black">Un onboarding contrôlé pour chaque église.</h2>
            <p className="mt-4 text-base leading-8 text-blue-100">
              Chaque nouvelle église est configurée étape par étape : identité, logo, modules, utilisateurs, PWA, notifications et validation finale.
            </p>
          </div>

          <div data-mpangi-global-process-grid className="grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <article key={step} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-black text-blue-200">Étape {index + 1}</p>
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
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#2563EB]">Réseau</p>
              <h2 className="mt-3 text-4xl font-black text-[#03357A]">Églises déjà présentes</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Liste publique alimentée depuis la base de données. Chaque église peut avoir sa page publique, son identité et son espace privé séparé.
              </p>
            </div>
            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
              {activeChurches.length} église(s) active(s)
            </div>
          </div>

          {churches.length > 0 ? (
            <div data-mpangi-global-churches-grid className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {churches.map((church) => (
                <Link key={church.id} href={buildChurchPublicUrl(church)} className="group rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 transition hover:-translate-y-1 hover:border-[#03357A]/30 hover:bg-white hover:shadow-xl hover:shadow-blue-900/10">
                  <div className="flex items-start gap-4">
                    <ChurchLogo church={church} />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-lg font-black text-[#03357A]">{church.name}</h3>
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
              <h3 className="mt-4 text-xl font-black text-[#03357A]">Aucune église publique disponible</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Les églises apparaîtront ici dès qu’elles seront créées dans la base de données.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="demo" className="relative overflow-hidden bg-[#071B3F] py-16 text-white">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#8B5CF6]/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#2563EB]/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100 ring-1 ring-white/10">
              <Presentation className="h-4 w-4" />
              Démonstration & devis
            </span>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Voyons ensemble comment digitaliser votre église.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-blue-100">
              Présentez-nous votre organisation et vos priorités. AKSANTIC Technology vous proposera une démonstration guidée et une configuration adaptée.
            </p>

            <div className="mt-7 space-y-3">
              {["Analyse de vos besoins", "Démonstration des modules utiles", "Proposition de déploiement", "Accompagnement et formation"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-white">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 sm:p-7">
            <h3 className="text-2xl font-black text-[#03357A]">Demander une démo ou un devis</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Quelques informations suffisent pour préparer un échange pertinent avec votre équipe.</p>
            <div className="mt-6">
              <CommercialContactForm />
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">AKSANTIC Technology</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Parlons de votre projet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">Une question, une demande de partenariat ou besoin d’une présentation rapide ? Contactez directement notre équipe.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href={AKSANTIC_WHATSAPP} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-sm font-black text-white">
                <MessageCircle className="h-5 w-5" /> WhatsApp : +243 801 655 726
              </a>
              <a href={`mailto:${AKSANTIC_EMAIL}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]">
                <Mail className="h-5 w-5" /> {AKSANTIC_EMAIL}
              </a>
              <a href={AKSANTIC_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">
                <Globe2 className="h-5 w-5" /> aksantictech.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DCEAF5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-xl font-black text-[#03357A]">Mpangi-Church</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">La solution web et mobile d’AKSANTIC Technology pour centraliser et moderniser la gestion de votre église.</p>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Découvrir</h3>
            <nav className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
              <a href="#modules" className="hover:text-[#03357A]">Modules</a>
              <a href="#avantages" className="hover:text-[#03357A]">Avantages</a>
              <Link href="/pricing" className="hover:text-[#03357A]">Forfaits et tarifs</Link>
              <a href="#processus" className="hover:text-[#03357A]">Mise en service</a>
              <a href="#eglises" className="hover:text-[#03357A]">Églises publiques</a>
            </nav>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Démarrer</h3>
            <nav className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
              <a href="#demo" className="hover:text-[#03357A]">Demander une démo</a>
              <a href="#demo" className="hover:text-[#03357A]">Demander un devis</a>
              <Link href="/login" className="hover:text-[#03357A]">Se connecter</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Nous contacter</h3>
            <nav className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
              <a href={AKSANTIC_WHATSAPP} target="_blank" rel="noreferrer" className="hover:text-[#03357A]">WhatsApp : +243 801 655 726</a>
              <a href={`mailto:${AKSANTIC_EMAIL}`} className="break-all hover:text-[#03357A]">{AKSANTIC_EMAIL}</a>
              <a href={AKSANTIC_URL} target="_blank" rel="noreferrer" className="hover:text-[#03357A]">www.aksantictech.com</a>
            </nav>
          </div>
        </div>
        <div className="border-t border-[#DCEAF5] px-4 py-5 text-center text-xs font-semibold text-slate-500">© 2026 Mpangi-Church — Une solution AKSANTIC Technology. Tous droits réservés.</div>
      </footer>

      <nav aria-label="Navigation commerciale mobile" className="fixed inset-x-0 bottom-0 z-[90] grid grid-cols-5 border-t border-[#DCEAF5] bg-white/95 px-1 pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}>
        {[
          ["Accueil", "#top", LayoutDashboard],
          ["Modules", "#modules", Network],
          ["Forfaits", "/pricing", Wallet],
          ["Démo / devis", "#demo", Presentation],
          ["Contact", "#contact", MessageCircle],
        ].map(([label, href, Icon]) => {
          const NavIcon = Icon as typeof LayoutDashboard;
          return (
            <a key={String(label)} href={String(href)} className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[10px] font-black text-[#03357A] hover:bg-[#EAF3FA]">
              <NavIcon className="h-5 w-5" />
              <span className="truncate">{String(label)}</span>
            </a>
          );
        })}
      </nav>
    </main>
  );
}
