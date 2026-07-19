import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  Check,
  Crown,
  Gem,
  Home,
  MessageCircle,
  Network,
  Presentation,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

const AKSANTIC_URL = "https://aksantictech.com";
const AKSANTIC_EMAIL = "aksantictech@gmail.com";
const AKSANTIC_WHATSAPP = "https://wa.me/243801655726";

type PricingPlan = {
  name: string;
  subtitle: string;
  installation: string;
  monthly: string;
  modules: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
  features: string[];
};

const plans: PricingPlan[] = [
  {
    name: "Standard",
    subtitle: "L’essentiel pour démarrer",
    installation: "500 USD",
    monthly: "150 USD",
    modules: "5 modules inclus",
    description: "Pour une église qui souhaite centraliser rapidement ses opérations essentielles.",
    icon: Building2,
    features: [
      "Gestion des membres",
      "Tableau de bord",
      "Annonces et notifications",
      "Événements et calendrier",
      "Dons et offrandes",
    ],
  },
  {
    name: "Professionnelle",
    subtitle: "La formule recommandée",
    installation: "2 500 USD",
    monthly: "300 USD",
    modules: "10 modules inclus",
    description: "Pour une église structurée qui veut automatiser son administration et son suivi pastoral.",
    icon: Crown,
    featured: true,
    features: [
      "Gestion des membres",
      "Tableau de bord",
      "Annonces et notifications",
      "Événements et calendrier",
      "Dons et offrandes",
      "Gestion des départements",
      "Gestion des cellules",
      "Suivi des visiteurs et des âmes",
      "Suivi pastoral et des ouvriers",
      "Rapports avancés",
    ],
  },
  {
    name: "Premium / Entreprise",
    subtitle: "Écosystème complet et sur mesure",
    installation: "4 000 USD",
    monthly: "500 USD",
    modules: "Modules illimités",
    description: "Pour les grandes églises, ministères et organisations ayant des besoins avancés.",
    icon: Gem,
    features: [
      "Finances",
      "Patrimoine",
      "Administration avancée",
      "École biblique",
      "Chorale",
      "Ressources humaines",
      "Ressources pastorales",
      "Bibliothèque numérique",
      "Campagnes d’évangélisation",
      "Intégrations et API",
      "Modules sur mesure",
    ],
  },
];

const faq = [
  {
    question: "Que couvre le montant d’installation ?",
    answer:
      "Il couvre la préparation initiale de votre espace, la configuration de l’identité de l’église, l’activation des modules retenus et l’accompagnement de mise en service défini dans votre proposition.",
  },
  {
    question: "Les modules peuvent-ils être adaptés ?",
    answer:
      "Oui. Les modules proposés sont adaptables à la vision, à l’organisation et aux exigences de chaque église. La sélection finale est validée pendant l’analyse des besoins.",
  },
  {
    question: "Puis-je ajouter des modules plus tard ?",
    answer:
      "Oui. Mpangi-Church est évolutif : votre église peut commencer avec les fonctions prioritaires, puis activer d’autres modules selon sa croissance.",
  },
  {
    question: "Comment choisir la bonne formule ?",
    answer:
      "Demandez une démonstration. Notre équipe analyse la taille de l’église, son organisation, ses utilisateurs et ses objectifs avant de proposer la formule la plus pertinente.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC] pb-20 text-[#0F172A] lg:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#DCEAF5] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#DCEAF5]">
              <img src="/icons/icon-192.png" alt="Mpangi-Church" className="h-10 w-10 rounded-xl object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black text-[#03357A]">Mpangi-Church</span>
              <span className="hidden text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 sm:block">AKSANTIC Technology</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <Link href="/">Accueil</Link>
            <Link href="/#modules">Modules</Link>
            <Link href="/pricing" className="text-[#2563EB]">Forfaits</Link>
            <Link href="/#demo">Démo & devis</Link>
            <Link href="/#contact">Contact</Link>
          </nav>

          <Link href="/#demo" className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-black text-white">
            Demander une démo
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ring-1 ring-white/20">
            <Sparkles className="h-4 w-4" /> Des formules évolutives
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-6xl">Choisissez la formule adaptée à votre église.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-blue-50 sm:text-lg">
            Commencez avec les modules prioritaires, puis faites évoluer la plateforme avec votre ministère.
          </p>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={[
                  "relative flex flex-col rounded-[2rem] border bg-white p-6 shadow-sm sm:p-7",
                  plan.featured
                    ? "border-violet-300 shadow-xl shadow-violet-900/10 ring-4 ring-violet-100"
                    : "border-[#DCEAF5]",
                ].join(" ")}
              >
                {plan.featured && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-violet-700 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Recommandée
                  </span>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#2563EB]">{plan.subtitle}</p>
                    <h2 className="mt-2 text-2xl font-black text-[#03357A]">{plan.name}</h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>

                <p className="mt-4 min-h-20 text-sm leading-7 text-slate-600">{plan.description}</p>

                <div className="mt-5 rounded-3xl bg-[#F8FBFD] p-5">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-bold text-slate-500">Abonnement</span>
                    <span className="text-3xl font-black text-[#03357A]">{plan.monthly}</span>
                  </div>
                  <p className="mt-1 text-right text-xs font-bold text-slate-400">par mois</p>
                  <div className="my-4 h-px bg-[#DCEAF5]" />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-500">Installation</span>
                    <span className="font-black text-[#03357A]">{plan.installation}</span>
                  </div>
                </div>

                <p className="mt-5 rounded-full bg-blue-50 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-blue-700">{plan.modules}</p>

                <ul className="mt-5 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/#demo"
                  className={[
                    "mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black",
                    plan.featured ? "bg-violet-700 text-white" : "bg-[#03357A] text-white",
                  ].join(" ")}
                >
                  Demander un devis <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          <strong>À noter :</strong> les modules sont adaptables à la vision et aux exigences de chaque église. Dans les formules Standard et Professionnelle, la sélection est faite selon vos priorités dans la limite du nombre de modules inclus. La formule Premium / Entreprise permet l’activation de modules illimités ainsi que des développements sur mesure.
        </div>
      </section>

      <section className="border-y border-[#DCEAF5] bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#8B5CF6]">Questions fréquentes</p>
            <h2 className="mt-3 text-3xl font-black text-[#03357A] sm:text-4xl">Avant de choisir votre formule</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <article key={item.question} className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
                <h3 className="font-black text-[#03357A]">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-[#03357A] to-[#8B5CF6] p-6 text-white shadow-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <ShieldCheck className="h-9 w-9" />
              <h2 className="mt-4 text-3xl font-black">Besoin d’une recommandation personnalisée ?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">Réservez une démonstration : nous vous aiderons à identifier la formule et les modules adaptés à votre organisation.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/#demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]">
                <Presentation className="h-5 w-5" /> Demander une démo
              </Link>
              <a href={AKSANTIC_WHATSAPP} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-500 px-5 py-3 text-sm font-black text-white">
                <MessageCircle className="h-5 w-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DCEAF5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-xl font-black text-[#03357A]">Mpangi-Church</p>
            <p className="mt-3 leading-7 text-slate-600">Une solution AKSANTIC Technology pour une gestion d’église moderne, structurée et évolutive.</p>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Navigation</h3>
            <nav className="mt-3 grid gap-2 font-semibold text-slate-600">
              <Link href="/">Accueil</Link>
              <Link href="/#modules">Modules</Link>
              <Link href="/pricing">Forfaits</Link>
              <Link href="/#eglises">Églises publiques</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Démarrer</h3>
            <nav className="mt-3 grid gap-2 font-semibold text-slate-600">
              <Link href="/#demo">Demander une démo</Link>
              <Link href="/#demo">Demander un devis</Link>
              <Link href="/login">Se connecter</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-black text-[#03357A]">Contact</h3>
            <nav className="mt-3 grid gap-2 font-semibold text-slate-600">
              <a href={AKSANTIC_WHATSAPP} target="_blank" rel="noreferrer">+243 801 655 726</a>
              <a href={`mailto:${AKSANTIC_EMAIL}`} className="break-all">{AKSANTIC_EMAIL}</a>
              <a href={AKSANTIC_URL} target="_blank" rel="noreferrer">www.aksantictech.com</a>
            </nav>
          </div>
        </div>
        <div className="border-t border-[#DCEAF5] px-4 py-5 text-center text-xs font-semibold text-slate-500">© 2026 Mpangi-Church — Tous droits réservés.</div>
      </footer>

      <nav aria-label="Navigation commerciale mobile" className="fixed inset-x-0 bottom-0 z-[90] grid grid-cols-5 border-t border-[#DCEAF5] bg-white/95 px-1 pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}>
        {[
          ["Accueil", "/", Home],
          ["Modules", "/#modules", Network],
          ["Forfaits", "/pricing", Wallet],
          ["Démo", "/#demo", Presentation],
          ["Contact", "/#contact", MessageCircle],
        ].map(([label, href, Icon]) => {
          const NavIcon = Icon as typeof Home;
          const active = String(href) === "/pricing";
          return (
            <Link key={String(label)} href={String(href)} className={["flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[10px] font-black", active ? "bg-[#EAF3FA] text-[#03357A]" : "text-slate-500"].join(" ")}>
              <NavIcon className="h-5 w-5" />
              <span className="max-w-full truncate">{String(label)}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
