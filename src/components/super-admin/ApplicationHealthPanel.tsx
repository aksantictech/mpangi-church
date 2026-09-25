import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Globe2,
  HardDrive,
  MemoryStick,
  RefreshCw,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";

export type HealthStatus = "ok" | "warning" | "danger" | "info";
export type HealthIcon =
  | "database"
  | "clock"
  | "memory"
  | "config"
  | "security"
  | "integrity"
  | "seo";

export type HealthMetric = {
  title: string;
  value: string;
  detail: string;
  percent: number;
  status: HealthStatus;
  icon: HealthIcon;
};

export type HealthSection = {
  title: string;
  description: string;
  status: HealthStatus;
  icon: HealthIcon;
  checks: Array<{
    title: string;
    description: string;
    status: HealthStatus;
  }>;
};

type ApplicationHealthPanelProps = {
  score: number;
  updatedAt: string;
  metrics: HealthMetric[];
  sections: HealthSection[];
};

const iconByName: Record<HealthIcon, LucideIcon> = {
  database: Database,
  clock: Clock3,
  memory: MemoryStick,
  config: ServerCog,
  security: ShieldCheck,
  integrity: HardDrive,
  seo: SearchCheck,
};

function statusMeta(status: HealthStatus) {
  if (status === "ok") {
    return {
      label: "Normal",
      badge: "bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    };
  }

  if (status === "warning") {
    return {
      label: "À surveiller",
      badge: "bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
      icon: TriangleAlert,
      iconColor: "text-amber-600",
    };
  }

  if (status === "danger") {
    return {
      label: "Critique",
      badge: "bg-red-50 text-red-700",
      bar: "bg-red-500",
      icon: XCircle,
      iconColor: "text-red-600",
    };
  }

  return {
    label: "Information",
    badge: "bg-blue-50 text-blue-700",
    bar: "bg-blue-500",
    icon: Activity,
    iconColor: "text-blue-600",
  };
}

function overallMeta(score: number) {
  if (score >= 90) {
    return {
      label: "Tout est en ordre",
      color: "#059669",
      badge: "bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 70) {
    return {
      label: "Quelques points à surveiller",
      color: "#D97706",
      badge: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Intervention recommandée",
    color: "#DC2626",
    badge: "bg-red-50 text-red-700",
  };
}

export default function ApplicationHealthPanel({
  score,
  updatedAt,
  metrics,
  sections,
}: ApplicationHealthPanelProps) {
  const overall = overallMeta(score);

  return (
    <section
      id="application-health"
      className="scroll-mt-24 space-y-5"
      aria-labelledby="application-health-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            Ressources en temps réel
          </p>
          <h2
            id="application-health-title"
            className="mt-2 text-2xl font-black text-[#03357A]"
          >
            Santé de l’application
          </h2>
        </div>
        <p className="text-xs font-semibold text-slate-400">
          Une jauge passe en alerte au-delà de son seuil recommandé.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = iconByName[metric.icon];
          const meta = statusMeta(metric.status);

          return (
            <article
              key={metric.title}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-[#7991B2]" />
                  <h3 className="truncate text-sm font-extrabold text-[#0F172A]">
                    {metric.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${meta.badge}`}
                >
                  {meta.label}
                </span>
              </div>

              <p className="mt-6 text-3xl font-black text-[#07143A]">
                {metric.value}
              </p>
              <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
                {metric.detail}
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${meta.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, metric.percent))}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${overall.color} ${score * 3.6}deg, #E8EEF5 0deg)`,
              }}
            >
              <div className="grid h-25 w-25 place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="text-3xl font-black text-[#07143A]">{score}</p>
                  <p className="text-xs font-bold text-slate-400">/ 100</p>
                </div>
              </div>
            </div>

            <div>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${overall.badge}`}
              >
                {overall.label}
              </span>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Mesures réelles du serveur et de Supabase. Dernière mesure : {updatedAt}.
              </p>
            </div>
          </div>

          <Link
            href="/super-admin/dashboard?health=refresh"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-black text-[#03357A] shadow-sm hover:bg-[#F8FBFD]"
          >
            <RefreshCw className="h-4 w-4" />
            Mesurer
          </Link>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = iconByName[section.icon];
            const sectionMeta = statusMeta(section.status);

            return (
              <article
                key={section.title}
                className="rounded-3xl border border-[#DCEAF5] bg-[#FBFDFF] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-[#07143A]">{section.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${sectionMeta.iconColor}`}>
                    {sectionMeta.label}
                  </span>
                </div>

                <ul className="mt-5 space-y-4">
                  {section.checks.map((check) => {
                    const checkMeta = statusMeta(check.status);
                    const CheckIcon = checkMeta.icon;

                    return (
                      <li key={check.title} className="flex gap-3">
                        <CheckIcon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${checkMeta.iconColor}`}
                        />
                        <div>
                          <p className="text-sm font-extrabold text-[#0F172A]">
                            {check.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {check.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-[#E8EEF5] pt-5">
          <a
            href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fmpangi-church.app%2F"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EAF3FA] px-4 py-2 text-xs font-black text-[#03357A]"
          >
            <Gauge className="h-4 w-4" /> PageSpeed
          </a>
          <a
            href="https://search.google.com/search-console?resource_id=sc-domain%3Ampangi-church.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EAF3FA] px-4 py-2 text-xs font-black text-[#03357A]"
          >
            <Globe2 className="h-4 w-4" /> Search Console
          </a>
          <a
            href="https://search.google.com/test/rich-results?url=https%3A%2F%2Fmpangi-church.app%2F"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#EAF3FA] px-4 py-2 text-xs font-black text-[#03357A]"
          >
            <SearchCheck className="h-4 w-4" /> Résultats enrichis
          </a>
        </div>
      </div>
    </section>
  );
}
