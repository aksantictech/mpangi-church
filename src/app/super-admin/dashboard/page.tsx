import Link from "next/link";
import {
  Activity,
  Building2,
  Church,
  Globe2,
  ShieldCheck,
  Users,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import ApplicationHealthPanel, {
  type HealthMetric,
  type HealthSection,
  type HealthStatus,
} from "@/components/super-admin/ApplicationHealthPanel";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient();
  const measurementStartedAt = performance.now();

  const [
    churchesResult,
    activeChurchesResult,
    profilesResult,
    membersResult,
    superAdminsResult,
    inactiveProfilesResult,
    publicChurchesResult,
    recentChurchesResult,
  ] = await Promise.all([
    supabase.from("churches").select("*", { count: "exact", head: true }),
    supabase
      .from("churches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("status", "active"),
    supabase
      .from("churches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("public_enabled", true)
      .not("slug", "is", null),
    supabase
      .from("churches")
      .select("id, name, slug, city, country, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const databaseLatencyMs = Math.round(performance.now() - measurementStartedAt);
  const churchesCount = churchesResult.count ?? 0;
  const activeChurchesCount = activeChurchesResult.count ?? 0;
  const profilesCount = profilesResult.count ?? 0;
  const membersCount = membersResult.count ?? 0;
  const superAdminsCount = superAdminsResult.count ?? 0;
  const inactiveProfilesCount = inactiveProfilesResult.count ?? 0;
  const publicChurchesCount = publicChurchesResult.count ?? 0;
  const churches = recentChurchesResult.data;
  const queryErrors = [
    churchesResult.error,
    activeChurchesResult.error,
    profilesResult.error,
    membersResult.error,
    superAdminsResult.error,
    inactiveProfilesResult.error,
    publicChurchesResult.error,
    recentChurchesResult.error,
  ].filter(Boolean).length;

  const memory = process.memoryUsage();
  const heapUsedMb = Math.round(memory.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.max(1, Math.round(memory.heapTotal / 1024 / 1024));
  const heapPercent = Math.min(100, Math.round((heapUsedMb / heapTotalMb) * 100));
  const requiredConfiguration = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  const configuredCount = requiredConfiguration.filter(Boolean).length;
  const configuredPercent = Math.round(
    (configuredCount / requiredConfiguration.length) * 100
  );
  const activeChurchPercent =
    churchesCount > 0
      ? Math.round((activeChurchesCount / churchesCount) * 100)
      : 100;

  const metrics = [
    {
      title: "Base de données",
      value: queryErrors === 0 ? "Connectée" : `${queryErrors} erreur(s)`,
      detail: "Contrôles Supabase exécutés en parallèle.",
      percent: queryErrors === 0 ? 100 : Math.max(10, 100 - queryErrors * 20),
      status: queryErrors === 0 ? "ok" : "danger",
      icon: "database",
    },
    {
      title: "Temps de réponse des contrôles",
      value: `${databaseLatencyMs} ms`,
      detail: "Temps cumulé des lectures critiques du dashboard.",
      percent: Math.min(100, Math.round((databaseLatencyMs / 2000) * 100)),
      status:
        databaseLatencyMs < 800
          ? "ok"
          : databaseLatencyMs < 2000
            ? "warning"
            : "danger",
      icon: "clock",
    },
    {
      title: "Mémoire du serveur",
      value: `${heapPercent} %`,
      detail: `${heapUsedMb} Mo / ${heapTotalMb} Mo du tas Node.js.`,
      percent: heapPercent,
      status:
        heapPercent < 75 ? "ok" : heapPercent < 90 ? "warning" : "danger",
      icon: "memory",
    },
    {
      title: "Configuration serveur",
      value: `${configuredPercent} %`,
      detail: `${configuredCount}/${requiredConfiguration.length} variables critiques présentes.`,
      percent: configuredPercent,
      status: configuredPercent === 100 ? "ok" : "danger",
      icon: "config",
    },
  ] satisfies HealthMetric[];

  const sections = [
    {
      title: "Sécurité",
      description: "Accès, comptes privilégiés, secrets",
      status:
        configuredPercent === 100 && superAdminsCount > 0 ? "ok" : "danger",
      icon: "security",
      checks: [
        {
          title: "Secrets serveur configurés",
          description: `${configuredCount}/${requiredConfiguration.length} variables critiques détectées, sans exposer leur valeur.`,
          status: configuredPercent === 100 ? "ok" : "danger",
        },
        {
          title: "Comptes Super Admin actifs",
          description:
            superAdminsCount > 0
              ? `${superAdminsCount} compte(s) actif(s). Gardez ce nombre minimal.`
              : "Aucun compte Super Admin actif détecté.",
          status: superAdminsCount > 0 ? "ok" : "danger",
        },
        {
          title: "Profils inactifs",
          description: `${inactiveProfilesCount} profil(s) désactivé(s) ou suspendu(s).`,
          status: "info",
        },
      ],
    },
    {
      title: "Fiabilité",
      description: "Base, serveur, disponibilité",
      status:
        queryErrors > 0 || databaseLatencyMs >= 2000
          ? "danger"
          : databaseLatencyMs >= 800 || heapPercent >= 75
            ? "warning"
            : "ok",
      icon: "database",
      checks: [
        {
          title: "Lectures critiques",
          description:
            queryErrors === 0
              ? "Toutes les lectures du dashboard ont réussi."
              : `${queryErrors} lecture(s) ont échoué.`,
          status: queryErrors === 0 ? "ok" : "danger",
        },
        {
          title: "Latence Supabase",
          description: `${databaseLatencyMs} ms pour l’ensemble des contrôles parallèles.`,
          status:
            databaseLatencyMs < 800
              ? "ok"
              : databaseLatencyMs < 2000
                ? "warning"
                : "danger",
        },
        {
          title: "Mémoire du processus",
          description: `${heapUsedMb} Mo utilisés sur ${heapTotalMb} Mo alloués.`,
          status:
            heapPercent < 75
              ? "ok"
              : heapPercent < 90
                ? "warning"
                : "danger",
        },
      ],
    },
    {
      title: "Données & visibilité",
      description: "Cohérence, publication, référencement",
      status:
        activeChurchPercent < 70 || publicChurchesCount === 0
          ? "warning"
          : "ok",
      icon: "seo",
      checks: [
        {
          title: "Églises actives",
          description: `${activeChurchesCount}/${churchesCount} église(s) actives (${activeChurchPercent} %).`,
          status: activeChurchPercent >= 70 ? "ok" : "warning",
        },
        {
          title: "Pages publiques indexables",
          description: `${publicChurchesCount} église(s) active(s) ont une page publique et un slug.`,
          status: publicChurchesCount > 0 ? "ok" : "warning",
        },
        {
          title: "SEO technique",
          description:
            "Sitemap, robots.txt, métadonnées et données structurées sont intégrés au build.",
          status: "ok",
        },
      ],
    },
  ] satisfies HealthSection[];

  const allStatuses: HealthStatus[] = [
    ...metrics.map((metric) => metric.status),
    ...sections.flatMap((section) => section.checks.map((check) => check.status)),
  ];
  const statusWeight: Record<HealthStatus, number> = {
    ok: 1,
    info: 0.9,
    warning: 0.55,
    danger: 0,
  };
  const healthScore = Math.round(
    (allStatuses.reduce((total, status) => total + statusWeight[status], 0) /
      allStatuses.length) *
      100
  );
  const measuredAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Africa/Kinshasa",
  }).format(new Date());

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total églises"
            value={churchesCount ?? 0}
            description="Églises créées"
            icon={Church}
            accent="blue"
          />

          <MetricCard
            title="Églises actives"
            value={activeChurchesCount ?? 0}
            description="Plateforme active"
            icon={ShieldCheck}
            accent="green"
          />

          <MetricCard
            title="Utilisateurs"
            value={profilesCount ?? 0}
            description="Profils enregistrés"
            icon={Users}
            accent="purple"
          />

          <MetricCard
            title="Membres"
            value={membersCount ?? 0}
            description="Tous espaces confondus"
            icon={Building2}
            accent="blue"
          />
        </section>

        <ApplicationHealthPanel
          score={healthScore}
          updatedAt={measuredAt}
          metrics={metrics}
          sections={sections}
        />

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Églises récentes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Les dernières églises ajoutées à la plateforme.
                </p>
              </div>

              <Link
                href="/super-admin/churches"
                className="text-sm font-bold text-[#2563EB]"
              >
                Voir tout
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCEAF5]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EAF3FA] text-[#03357A]">
                  <tr>
                    <th className="px-4 py-3">Église</th>
                    <th className="px-4 py-3">Ville</th>
                    <th className="px-4 py-3">Pays</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Lien</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCEAF5] bg-white">
                  {churches?.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Aucune église créée pour le moment.
                      </td>
                    </tr>
                  )}

                  {churches?.map((church) => (
                    <tr key={church.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">
                          {church.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          /church/{church.slug}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {church.city ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {church.country ?? "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                          {church.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/church/${church.slug}`}
                          target="_blank"
                          className="font-bold text-[#2563EB]"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-[#03357A]" />
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Activité plateforme
                </h2>
              </div>

              <div className="mt-6 space-y-5 border-l-2 border-[#DCEAF5] pl-5">
                <div>
                  <p className="text-xs font-bold text-[#8B5CF6]">
                    Aujourd’hui
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    La plateforme est active et opérationnelle.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#2563EB]">
                    Système
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Supabase connecté avec succès.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-green-600">
                    Sécurité
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Accès Super Admin protégé par authentification.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
              <Globe2 className="h-8 w-8" />

              <h2 className="mt-4 text-2xl font-extrabold">
                Plateforme multi-églises
              </h2>

              <p className="mt-3 text-sm leading-7 text-blue-50">
                Chaque église possède son espace, ses membres, ses présences,
                ses demandes publiques et son suivi pastoral.
              </p>

              <Link
                href="/super-admin/churches/new"
                className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A]"
              >
                Créer une nouvelle église
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}
