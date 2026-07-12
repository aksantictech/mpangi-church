import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Church,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const publicChurches = [
  {
    name: "La Maison de Miséricorde",
    href: "/church/maison-misericorde-cmp",
  },
  {
    name: "ICC Kinshasa",
    href: "/church/iccrdc",
  },
];

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-[#F5F9FC]">
      <header className="border-b border-[#DCEAF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#03357A] text-white">
              <Church className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-black text-[#03357A]">
                Mpangi-church
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                AKSANTIC Technology
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A] sm:inline-flex"
            >
              Connexion
            </Link>

            <Link
              href="/super-admin/dashboard"
              className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-black text-white"
            >
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <div className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8 lg:p-10">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-blue-100">
            Plateforme multi-églises
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Une plateforme sécurisée pour gérer plusieurs églises.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-blue-50">
            Mpangi-church centralise les membres, présences, extensions,
            finances, patrimoine, administration, enseignements et dashboards
            par rôle. Chaque église possède son espace privé et son domaine
            dédié.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]"
            >
              Se connecter
            </Link>

            <Link
              href="#eglises"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white"
            >
              Voir les églises publiques
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              title: "Accès sécurisé",
              description:
                "Le domaine principal affiche une page publique. Les dashboards privés restent protégés.",
              icon: LockKeyhole,
            },
            {
              title: "Espaces séparés",
              description:
                "Chaque église utilise son sous-domaine privé et ses propres données.",
              icon: Building2,
            },
            {
              title: "PWA mobile",
              description:
                "Installation mobile avec logo et identité propres à chaque église.",
              icon: Smartphone,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-xl font-black text-[#03357A]">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="eglises" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#2563EB]">
                Pages publiques
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#03357A]">
                Églises disponibles
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Les espaces privés ne sont pas accessibles depuis cette page.
                Utilisez le domaine privé de votre église pour accéder au
                dashboard.
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Page publique sécurisée
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {publicChurches.map((church) => (
              <Link
                key={church.href}
                href={church.href}
                className="flex items-center justify-between rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 transition hover:border-[#03357A]/30 hover:bg-[#EAF3FA]"
              >
                <span>
                  <span className="block text-lg font-black text-[#03357A]">
                    {church.name}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-500">
                    Page publique
                  </span>
                </span>

                <ShieldCheck className="h-6 w-6 text-[#03357A]" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
