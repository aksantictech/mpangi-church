import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Church,
  ClipboardList,
  Download,
  Gift,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareHeart,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PublicChurch = {
  id: string;
  name: string | null;
  public_name: string | null;
  slug: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  pastor_name: string | null;
  public_message: string | null;
};

const adminLinks: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Dashboard",
    description: "Vue globale de l’église et indicateurs clés.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Membres",
    description: "Membres, photos, QR Codes, imports Excel.",
    href: "/members",
    icon: Users,
  },
  {
    title: "Présences",
    description: "Pointage manuel et scanner QR.",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Départements",
    description: "Services, ministères et affectations.",
    href: "/departments",
    icon: Building2,
  },
  {
    title: "Événements",
    description: "Cultes, réunions, formations et campagnes.",
    href: "/events",
    icon: ClipboardList,
  },
  {
    title: "Suivi des âmes",
    description: "Accompagnement pastoral et intégration.",
    href: "/souls",
    icon: HeartHandshake,
  },
  {
    title: "Demandes publiques",
    description: "Prières, rendez-vous, adhésions et témoignages.",
    href: "/public-requests",
    icon: MessageSquareHeart,
  },
  {
    title: "Paramètres",
    description: "Configuration de l’église et du compte.",
    href: "/settings",
    icon: Settings,
  },
];

function getPublicChurchName(church: PublicChurch) {
  const publicName = church.public_name?.trim();

  if (publicName) {
    return publicName;
  }

  const name = church.name?.trim();

  if (!name) {
    return "Église";
  }

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: churches } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      city,
      country,
      logo_url,
      pastor_name,
      public_message
    `
    )
    .eq("public_enabled", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const publicChurches = (churches ?? []) as PublicChurch[];
  const firstChurchSlug = publicChurches[0]?.slug || "maison-misericorde-cmp";

  return (
    <main className="min-h-screen overflow-hidden bg-[#F5F9FC] text-[#0F172A]">
      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="/images/login-illustration.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5F9FC] via-[#F5F9FC]/95 to-[#EAF3FA]/90" />
        </div>

        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
        <div className="absolute right-[-120px] top-32 h-96 w-96 rounded-full bg-[#3F79B3]/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col px-4 py-8 md:px-8">
          <header className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#DCEAF5]">
                <Image
                  src="/images/mpangi-logo.png"
                  alt="Mpangi-church"
                  width={42}
                  height={42}
                  className="object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold text-[#03357A] md:text-xl">
                  Mpangi-church
                </p>

                <p className="hidden text-xs font-semibold text-[#8B5CF6] sm:block">
                  Gérer avec foi, servir avec amour
                </p>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/church/${firstChurchSlug}`}
                className="hidden rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA] md:inline-flex"
              >
                Page publique
              </Link>

              <Link
                href="/install"
                className="hidden items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA] sm:inline-flex"
              >
                Installer l’application
                <Download className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-[#022B63] md:px-5"
              >
                Connexion
                <LockKeyhole className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCEAF5] bg-white/90 px-4 py-2 text-sm font-extrabold text-[#03357A] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                AKSANTIC Technology
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-[#03357A] md:text-7xl">
                Une application moderne pour administrer votre église.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Centralisez les membres, présences, départements, événements,
                demandes publiques, dons, QR Codes et suivi pastoral dans une
                seule plateforme simple, sécurisée et installable.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-900/20"
                >
                  Accéder à l’administration
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={`/church/${firstChurchSlug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-6 py-4 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA]"
                >
                  Voir une page publique
                  <Church className="h-4 w-4" />
                </Link>

                <Link
                  href="/install"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-6 py-4 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA] sm:hidden"
                >
                  Installer l’application
                  <Download className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                <SmallStat
                  value="Multi-églises"
                  label="Données séparées et sécurisées"
                />
                <SmallStat
                  value="PWA"
                  label="Installable sur téléphone et PC"
                />
                <SmallStat
                  value="QR Code"
                  label="Pointage rapide des présences"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#03357A]/20 to-[#8B5CF6]/20 blur-2xl" />

              <div className="relative rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur">
                <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] text-white">
                  <div className="relative min-h-[230px] p-6">
                    <Image
                      src="/images/login-illustration.png"
                      alt="Gestion église"
                      fill
                      sizes="(min-width: 1024px) 420px, 100vw"
                      className="object-cover opacity-25"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-[#03357A] via-[#03357A]/80 to-transparent" />

                    <div className="relative max-w-sm">
                      <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-100">
                        Espace administration
                      </p>

                      <h2 className="mt-3 text-3xl font-extrabold">
                        Accès rapide aux modules
                      </h2>

                      <p className="mt-3 text-sm leading-7 text-blue-50">
                        Connectez-vous pour gérer les données de votre église.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {adminLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 transition hover:bg-white hover:shadow-md"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[#03357A]">
                            {item.title}
                          </p>

                          <p className="line-clamp-1 text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03357A]" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {publicChurches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#8B5CF6]">
                Pages publiques
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#03357A]">
                Églises disponibles
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                Accédez aux pages publiques des églises actives : présentation,
                demandes, rendez-vous, témoignages et dons.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] ring-1 ring-[#DCEAF5] hover:bg-[#EAF3FA]"
            >
              Administration
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {publicChurches.map((church) => {
              const churchPublicName = getPublicChurchName(church);

              return (
                <article
                  key={church.id}
                  className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#EAF3FA] text-[#03357A]">
                      {church.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={church.logo_url}
                          alt={churchPublicName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Church className="h-8 w-8" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-[#03357A]">
                        {churchPublicName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {[church.city, church.country]
                          .filter(Boolean)
                          .join(", ") || "Localisation non renseignée"}
                      </p>

                      {church.pastor_name && (
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {church.pastor_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-500">
                    {church.public_message ||
                      "Découvrez la page publique de cette église."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/church/${church.slug}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
                    >
                      Ouvrir
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href={`/church/${church.slug}#don`}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#DCEAF5]"
                    >
                      Don
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Sécurité par église"
            description="Chaque église voit uniquement ses membres, présences, départements, événements et suivis."
          />

          <FeatureCard
            icon={Gift}
            title="Dons publics"
            description="Mobile Money, carte bancaire et virement bancaire sur la page publique."
          />

          <FeatureCard
            icon={MessageSquareHeart}
            title="Demandes publiques"
            description="Prières, rendez-vous, témoignages et demandes d’intégration depuis la page publique."
          />
        </div>
      </section>
    </main>
  );
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white/90 p-4 shadow-sm backdrop-blur">
      <p className="font-black text-[#03357A]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {label}
      </p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[2rem] border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-[#03357A]">{title}</h3>

      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
    </article>
  );
}