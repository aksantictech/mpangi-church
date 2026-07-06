import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Globe,
  HelpCircle,
  Radio,
  Settings,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Video,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

type CheckStatus = "ok" | "warning" | "danger" | "info";

function getPublicChurchName(church: {
  name?: string | null;
  public_name?: string | null;
  pwa_name?: string | null;
}) {
  const pwaName = church.pwa_name?.trim();
  if (pwaName) return pwaName;

  const publicName = church.public_name?.trim();
  if (publicName) return publicName;

  const name = church.name?.trim();
  if (!name) return "Église";

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

function getStatusStyle(status: CheckStatus) {
  if (status === "ok") {
    return {
      icon: CheckCircle2,
      badge: "bg-green-50 text-green-700",
      card: "border-green-100 bg-green-50/40",
      iconBox: "bg-green-50 text-green-700",
      label: "OK",
    };
  }

  if (status === "warning") {
    return {
      icon: AlertTriangle,
      badge: "bg-orange-50 text-orange-700",
      card: "border-orange-100 bg-orange-50/40",
      iconBox: "bg-orange-50 text-orange-700",
      label: "À compléter",
    };
  }

  if (status === "danger") {
    return {
      icon: XCircle,
      badge: "bg-red-50 text-red-700",
      card: "border-red-100 bg-red-50/40",
      iconBox: "bg-red-50 text-red-700",
      label: "Erreur",
    };
  }

  return {
    icon: HelpCircle,
    badge: "bg-blue-50 text-blue-700",
    card: "border-blue-100 bg-blue-50/40",
    iconBox: "bg-blue-50 text-blue-700",
    label: "Info",
  };
}

async function getExactCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  churchId: string,
  extra?: (query: any) => any
) {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId);

  if (extra) {
    query = extra(query);
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export default async function SystemCheckPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      pwa_name,
      pwa_short_name,
      slug,
      status,
      public_enabled,
      login_enabled,
      custom_domain,
      custom_domain_verified,
      member_form_enabled,
      member_form_token,
      live_stream_enabled,
      live_stream_url,
      live_stream_title,
      logo_url,
      pastor_name,
      phone,
      whatsapp,
      email,
      service_times
    `
    )
    .eq("id", profile.church_id)
    .maybeSingle();

  if (!church) {
    redirect("/settings");
  }

  const [
    membersCount,
    membersWithQrCount,
    departmentsCount,
    publicationsCount,
    publishedPublicationsCount,
    pushSubscriptionsCount,
  ] = await Promise.all([
    getExactCount(supabase, "members", church.id),
    getExactCount(supabase, "members", church.id, (query) =>
      query.not("qr_token", "is", null)
    ),
    getExactCount(supabase, "departments", church.id),
    getExactCount(supabase, "church_publications", church.id),
    getExactCount(supabase, "church_publications", church.id, (query) =>
      query.eq("is_published", true)
    ),
    getExactCount(supabase, "push_subscriptions", church.id),
  ]);

  const churchName = getPublicChurchName(church);
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mpangi-church.app";

  const publicPageUrl = church.slug
    ? `${appBaseUrl}/church/${church.slug}`
    : null;

  const customDomainUrl = church.custom_domain
    ? `https://${church.custom_domain}`
    : null;

  const memberRegistrationUrl =
    church.slug && church.member_form_token
      ? `${appBaseUrl}/church/${church.slug}/member-registration?token=${church.member_form_token}`
      : null;

  const vapidConfigured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );

  const qrCoverage =
    membersCount > 0 ? Math.round((membersWithQrCount / membersCount) * 100) : 0;

  const checks = [
    {
      title: "Église active",
      description:
        church.status === "active"
          ? "L’église est active dans la plateforme."
          : "L’église n’est pas active. La page publique peut être bloquée.",
      status: church.status === "active" ? "ok" : "danger",
      icon: ShieldCheck,
      actionHref: "/settings/public-page",
      actionLabel: "Vérifier",
    },
    {
      title: "Page publique",
      description:
        church.public_enabled && church.slug
          ? "La page publique est activée et accessible."
          : "La page publique n’est pas encore totalement activée.",
      status: church.public_enabled && church.slug ? "ok" : "warning",
      icon: Globe,
      actionHref: publicPageUrl,
      actionLabel: "Ouvrir",
      external: true,
    },
    {
      title: "Sous-domaine / domaine",
      description:
        church.custom_domain && church.custom_domain_verified
          ? `${church.custom_domain} est lié à cette église.`
          : "Aucun sous-domaine vérifié n’est encore lié à cette église.",
      status:
        church.custom_domain && church.custom_domain_verified
          ? "ok"
          : "warning",
      icon: Globe,
      actionHref: customDomainUrl,
      actionLabel: "Ouvrir domaine",
      external: true,
    },
    {
      title: "Formulaire public membre",
      description:
        church.member_form_enabled && church.member_form_token
          ? "Le formulaire public d’inscription membre est actif."
          : "Le formulaire public membre n’est pas encore actif.",
      status:
        church.member_form_enabled && church.member_form_token
          ? "ok"
          : "warning",
      icon: UserPlus,
      actionHref: "/settings/member-registration",
      actionLabel: "Configurer",
    },
    {
      title: "QR personnel membre",
      description:
        membersCount === 0
          ? "Aucun membre enregistré pour vérifier la couverture QR."
          : `${membersWithQrCount}/${membersCount} membres ont un QR personnel généré (${qrCoverage}%).`,
      status:
        membersCount === 0
          ? "info"
          : membersWithQrCount === membersCount
            ? "ok"
            : "warning",
      icon: ClipboardCheck,
      actionHref: "/members",
      actionLabel: "Voir membres",
    },
    {
      title: "Départements",
      description:
        departmentsCount > 0
          ? `${departmentsCount} département(s) configuré(s).`
          : "Aucun département configuré pour cette église.",
      status: departmentsCount > 0 ? "ok" : "warning",
      icon: Settings,
      actionHref: "/departments",
      actionLabel: "Configurer",
    },
    {
      title: "Enseignements / vidéos",
      description:
        publishedPublicationsCount > 0
          ? `${publishedPublicationsCount} publication(s) visible(s) sur la page publique.`
          : publicationsCount > 0
            ? "Des publications existent, mais aucune n’est encore publiée."
            : "Aucun enseignement ou vidéo publié pour le moment.",
      status:
        publishedPublicationsCount > 0
          ? "ok"
          : publicationsCount > 0
            ? "warning"
            : "info",
      icon: Video,
      actionHref: "/publications",
      actionLabel: "Gérer",
    },
    {
      title: "Culte en direct",
      description:
        church.live_stream_enabled && church.live_stream_url
          ? "Le bloc culte en direct est actif sur la page publique."
          : "Aucun culte en direct actif pour le moment.",
      status:
        church.live_stream_enabled && church.live_stream_url ? "ok" : "info",
      icon: Radio,
      actionHref: "/settings/live-stream",
      actionLabel: "Configurer",
    },
    {
      title: "Notifications push",
      description: vapidConfigured
        ? pushSubscriptionsCount > 0
          ? `${pushSubscriptionsCount} téléphone(s) abonné(s) aux notifications.`
          : "Les clés VAPID sont configurées, mais aucun téléphone n’est encore abonné."
        : "Les clés VAPID ne sont pas configurées. Les notifications ne peuvent pas partir.",
      status: vapidConfigured
        ? pushSubscriptionsCount > 0
          ? "ok"
          : "warning"
        : "danger",
      icon: BellRing,
      actionHref: publicPageUrl,
      actionLabel: "Activer sur mobile",
      external: true,
    },
    {
      title: "PWA / installation mobile",
      description:
        church.pwa_name || church.pwa_short_name
          ? "Le nom PWA de cette église est configuré."
          : "Le nom PWA utilise les informations par défaut de l’église.",
      status: "info",
      icon: Smartphone,
      actionHref: church.slug ? `/church/${church.slug}/install` : undefined,
      actionLabel: "Tester installation",
    },
  ] satisfies {
    title: string;
    description: string;
    status: CheckStatus;
    icon: any;
    actionHref?: string | null;
    actionLabel?: string;
    external?: boolean;
  }[];

  const okCount = checks.filter((check) => check.status === "ok").length;
  const warningCount = checks.filter((check) => check.status === "warning")
    .length;
  const dangerCount = checks.filter((check) => check.status === "danger").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                <ClipboardCheck className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  Vérification système
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  {churchName}
                </h1>

                <p className="mt-2 text-sm leading-7 text-blue-50">
                  Contrôle rapide de la configuration publique, mobile, QR,
                  notifications et publications.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryPill label="OK" value={okCount} />
              <SummaryPill label="À compléter" value={warningCount} />
              <SummaryPill label="Erreurs" value={dangerCount} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Page publique"
            value={church.slug || "-"}
            description={publicPageUrl || "Aucun lien disponible"}
          />

          <InfoCard
            title="Domaine"
            value={church.custom_domain || "Non configuré"}
            description={
              church.custom_domain_verified
                ? "Domaine vérifié"
                : "Domaine non vérifié"
            }
          />

          <InfoCard
            title="QR membres"
            value={`${membersWithQrCount}/${membersCount}`}
            description="Membres avec QR personnel"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {checks.map((check) => (
            <SystemCheckCard
              key={check.title}
              title={check.title}
              description={check.description}
              status={check.status}
              icon={check.icon}
              actionHref={check.actionHref}
              actionLabel={check.actionLabel}
              external={check.external}
            />
          ))}
        </section>

        {memberRegistrationUrl && (
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Liens utiles
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {publicPageUrl && (
                <UsefulLink
                  title="Page publique"
                  href={publicPageUrl}
                  external
                />
              )}

              {customDomainUrl && (
                <UsefulLink
                  title="Sous-domaine église"
                  href={customDomainUrl}
                  external
                />
              )}

              <UsefulLink
                title="Formulaire public membre"
                href={memberRegistrationUrl}
                external
              />

              {church.slug && (
                <UsefulLink
                  title="Page installation PWA"
                  href={`/church/${church.slug}/install`}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-blue-100">
        {label}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 truncate text-xl font-black text-[#03357A]">
        {value}
      </p>
      <p className="mt-1 break-words text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SystemCheckCard({
  title,
  description,
  status,
  icon: Icon,
  actionHref,
  actionLabel,
  external,
}: {
  title: string;
  description: string;
  status: CheckStatus;
  icon: any;
  actionHref?: string | null;
  actionLabel?: string;
  external?: boolean;
}) {
  const style = getStatusStyle(status);
  const StatusIcon = style.icon;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${style.card}`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBox}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#03357A]">
                {title}
              </h2>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${style.badge}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {style.label}
              </span>
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            target={external ? "_blank" : undefined}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5] hover:bg-[#F8FBFD]"
          >
            {actionLabel}
            {external && <ExternalLink className="h-4 w-4" />}
          </Link>
        )}
      </div>
    </article>
  );
}

function UsefulLink({
  title,
  href,
  external,
}: {
  title: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center justify-between gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA]"
    >
      <span className="truncate">{title}</span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </Link>
  );
}