"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  HeartHandshake,
  Loader2,
  PackageCheck,
  ShieldCheck,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react";

type RoleCard = {
  code: string;
  title: string;
  description: string;
  href: string;
  tone: string;
};

type DashboardFilters = {
  month: string;
  department: string;
  departments: Array<{ id: string; name: string }>;
};

type Payload = {
  profile: {
    full_name?: string;
    role?: string;
    church_id?: string | null;
  };
  config: {
    role: string;
    title: string;
    subtitle: string;
    focus: string;
    cards: RoleCard[];
  };
  stats: Record<string, number>;
  filters?: DashboardFilters;
};

const ICONS: Record<string, any> = {
  overview: ShieldCheck,
  members: UsersRound,
  attendance: CalendarDays,
  souls: HeartHandshake,
  public_requests: Bell,
  events: CalendarDays,
  departments: Building2,
  administration: FileText,
  appointments: ClipboardList,
  finance: Wallet,
  patrimony: Warehouse,
  maintenance: PackageCheck,
  extensions: Activity,
  notifications: Bell,
  tasks: ClipboardCheck,
  correspondence: FileText,
  transmissions: FileText,
  minutes: FileCheck2,
};

const statByCard: Record<string, (stats: Record<string, number>) => string> = {
  overview: () => "Vue",
  members: (stats) => String(stats.members ?? 0),
  attendance: (stats) => String(stats.attendanceThisMonth ?? 0),
  souls: (stats) => String(stats.souls ?? 0),
  public_requests: (stats) =>
    String(stats.pendingPublicRequests ?? stats.publicRequests ?? 0),
  events: (stats) => String(stats.events ?? 0),
  departments: (stats) => String(stats.departments ?? 0),
  administration: (stats) =>
    String((stats.correspondence ?? 0) + (stats.tasks ?? 0)),
  appointments: () => "Suivi",
  finance: (stats) =>
    String((stats.offeringsToday ?? 0) + (stats.expensesThisMonth ?? 0)),
  patrimony: (stats) => String(stats.assets ?? 0),
  maintenance: (stats) => String(stats.maintenances ?? 0),
  extensions: (stats) =>
    String(stats.extensions ?? stats.extensionActivities ?? 0),
  notifications: () => "Alertes",
  tasks: (stats) => String(stats.tasks ?? 0),
  correspondence: (stats) => String(stats.correspondence ?? 0),
  transmissions: (stats) => String(stats.transmissions ?? 0),
  minutes: (stats) => String(stats.minutes ?? 0),
};

const toneClasses: Record<string, string> = {
  blue: "bg-[#EAF3FA] text-[#03357A]",
  green: "bg-green-50 text-green-700",
  violet: "bg-violet-50 text-violet-700",
  orange: "bg-orange-50 text-orange-700",
  slate: "bg-slate-100 text-slate-700",
};

export default function RoleDashboardPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [month, setMonth] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard/role", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Chargement impossible.");
        }

        setPayload(data);
        setMonth(data.filters?.month || "");
        setDepartment(data.filters?.department || "");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Erreur de chargement."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchDashboard();

    return () => controller.abort();
  }, []);

  const visibleCards = useMemo(() => payload?.config.cards ?? [], [payload]);

  async function applySecretaryFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (department) params.set("department", department);

      const response = await fetch(`/api/dashboard/role?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Actualisation impossible.");
      }

      setPayload(data);
      setMonth(data.filters?.month || month);
      setDepartment(data.filters?.department || department);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur d’actualisation."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && !payload) {
    return (
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#03357A]" />
        <p className="mt-3 text-sm font-black text-[#03357A]">
          Chargement des indicateurs...
        </p>
      </section>
    );
  }

  if (errorMessage && !payload) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5" />
          <div>
            <h2 className="font-black">Indicateurs indisponibles</h2>
            <p className="mt-1 text-sm font-semibold">{errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!payload) return null;

  if (payload.config.role === "secretaire") {
    return (
      <section className="space-y-5">
        <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <h2 className="text-2xl font-black text-[#03357A]">
                Pilotage du secrétariat
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Suivez le traitement des dossiers, la réception des rapports des
                départements et des extensions ainsi que leur promptitude.
              </p>
            </div>
            <div className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-bold text-[#03357A]">
              {payload.config.focus}
            </div>
          </div>

          <form
            onSubmit={applySecretaryFilters}
            className="mt-5 grid gap-3 border-t border-[#DCEAF5] pt-5 md:grid-cols-[180px_1fr_auto]"
          >
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-[#03357A]"
            />

            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-bold text-[#03357A]"
            >
              <option value="">Tous les départements</option>
              {(payload.filters?.departments || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Actualiser
            </button>
          </form>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Le mois s’applique à tous les indicateurs. Le filtre département affine
            la complétude et la promptitude des rapports départementaux ; les dossiers
            administratifs et extensions restent consolidés au niveau de l’église.
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SecretaryKpi
            icon={FileCheck2}
            label="Dossiers traités"
            value={payload.stats.processedFilesPct ?? 0}
            detail={`${payload.stats.processedFiles ?? 0} traité(s) sur ${payload.stats.totalFiles ?? 0}`}
          />
          <SecretaryKpi
            icon={Building2}
            label="Rapports départements reçus"
            value={payload.stats.departmentReportsPct ?? 0}
            detail={`${payload.stats.receivedDepartmentReports ?? 0} reçu(s) sur ${payload.stats.expectedDepartmentReports ?? 0}`}
          />
          <SecretaryKpi
            icon={CalendarCheck}
            label="Promptitude des rapports"
            value={payload.stats.departmentPromptitudePct ?? 0}
            detail={`${payload.stats.promptDepartmentReports ?? 0} reçu(s) dans le délai`}
          />
          <SecretaryKpi
            icon={Activity}
            label="Rapports extensions reçus"
            value={payload.stats.extensionReportsPct ?? 0}
            detail={`${payload.stats.receivedExtensionReports ?? 0} reçu(s) sur ${payload.stats.expectedExtensionReports ?? 0}`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = ICONS[card.code] || ShieldCheck;
            const value = statByCard[card.code]?.(payload.stats) ?? "—";

            return (
              <Link
                key={card.code}
                href={card.href}
                className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      {card.title}
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#03357A]">
                      {value}
                    </p>
                  </div>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      toneClasses[card.tone] ?? toneClasses.blue
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-black text-[#03357A]">
              {payload.config.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              {payload.config.subtitle}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-[#03357A]">
            {payload.config.focus}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((card) => {
          const Icon = ICONS[card.code] || ShieldCheck;
          const value = statByCard[card.code]?.(payload.stats) ?? "—";

          return (
            <Link
              key={card.code}
              href={card.href}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#03357A]">
                    {value}
                  </p>
                </div>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    toneClasses[card.tone] ?? toneClasses.blue
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SecretaryKpi({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: any;
  label: string;
  value: number;
  detail: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-4xl font-black text-[#03357A]">
            {safeValue}%
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">{detail}</p>
    </article>
  );
}
