"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartHandshake,
  Landmark,
  Loader2,
  PackageCheck,
  PieChart,
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
};

const statByCard: Record<string, (stats: Record<string, number>) => string> = {
  overview: () => "Vue",
  members: (stats) => String(stats.members ?? 0),
  attendance: (stats) => String(stats.attendanceThisMonth ?? 0),
  souls: (stats) => String(stats.souls ?? 0),
  public_requests: (stats) => String(stats.pendingPublicRequests ?? stats.publicRequests ?? 0),
  events: (stats) => String(stats.events ?? 0),
  departments: (stats) => String(stats.departments ?? 0),
  administration: (stats) => String((stats.correspondence ?? 0) + (stats.tasks ?? 0)),
  appointments: () => "Suivi",
  finance: (stats) => String((stats.offeringsToday ?? 0) + (stats.expensesThisMonth ?? 0)),
  patrimony: (stats) => String(stats.assets ?? 0),
  maintenance: (stats) => String(stats.maintenances ?? 0),
  extensions: (stats) => String(stats.extensions ?? stats.extensionActivities ?? 0),
  notifications: () => "Alertes",
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

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/dashboard/role", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chargement impossible.");
      }

      setPayload(data);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const visibleCards = useMemo(() => payload?.config.cards ?? [], [payload]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#03357A]" />
        <p className="mt-3 text-sm font-black text-[#03357A]">
          Chargement du dashboard personnalisé...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50 p-5 text-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5" />
          <div>
            <h2 className="font-black">Dashboard personnalisé indisponible</h2>
            <p className="mt-1 text-sm font-semibold">{errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!payload) return null;

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-600">
              Dashboard personnalisé
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#03357A]">
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
                  <p className="text-sm font-bold text-slate-500">{card.title}</p>
                  <p className="mt-2 text-3xl font-black text-[#03357A]">
                    {value}
                  </p>
                </div>

                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${toneClasses[card.tone] ?? toneClasses.blue}`}>
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

      <div className="rounded-3xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700">
        <CheckCircle2 className="mr-2 inline h-4 w-4" />
        Vue adaptée au rôle : {payload.config.role}
      </div>
    </section>
  );
}
