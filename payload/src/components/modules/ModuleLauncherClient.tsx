"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Grid3X3,
  HandCoins,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Network,
  PackageSearch,
  QrCode,
  Settings,
  ShieldCheck,
  UsersRound,
  Wallet,
  Wrench,
} from "lucide-react";

type NavigationItem = {
  code: string;
  label: string;
  href: string;
  category?: string;
};

type Payload = {
  data?: {
    items?: NavigationItem[];
  };
};

const ICONS: Record<string, LucideIcon> = {
  role_dashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  my_work: BriefcaseBusiness,
  members: UsersRound,
  attendance: QrCode,
  souls: HeartHandshake,
  departments: Network,
  events: CalendarDays,
  public_requests: ClipboardCheck,
  teachings: BookOpen,
  notifications: Bell,
  correspondence: FileText,
  inbox: FileText,
  transmissions: FileText,
  tasks: ClipboardCheck,
  minutes: FileText,
  finance_dashboard: Wallet,
  offerings: HandCoins,
  expenses: CircleDollarSign,
  budgets: ChartNoAxesCombined,
  finance_reports: Landmark,
  donations: HandCoins,
  patrimony: Building2,
  assets: PackageSearch,
  maintenance: Wrench,
  movements: Boxes,
  extensions: Network,
  users: UsersRound,
  security: ShieldCheck,
  settings: Settings,
};

const ACCENTS = [
  "from-blue-700 to-blue-500",
  "from-violet-700 to-violet-500",
  "from-emerald-700 to-emerald-500",
  "from-cyan-700 to-cyan-500",
  "from-amber-700 to-orange-500",
  "from-rose-700 to-pink-500",
];

export default function ModuleLauncherClient() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    fetch("/api/security/navigation", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const payload = (await response.json()) as Payload & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error || "Navigation indisponible."
          );
        }

        if (mounted) {
          setItems(payload.data?.items || []);
        }
      })
      .catch((loadError: any) => {
        if (mounted) {
          setError(
            loadError?.message ||
              "Impossible de charger les modules."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      `${item.label} ${item.code} ${item.category || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [items, query]);

  return (
    <section className="space-y-5">
      <div className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
        <Grid3X3 className="h-8 w-8" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
          Lanceur d’applications
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Mes modules
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Ouvrez rapidement les fonctions autorisées pour votre rôle.
        </p>
      </div>

      <div className="rounded-2xl border border-[#DCEAF5] bg-white p-3 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un module..."
          className="min-h-12 w-full rounded-xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-semibold outline-none focus:border-[#03357A]"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div
          data-mpangi-module-grid
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-[#DCEAF5]"
            />
          ))}
        </div>
      ) : (
        <div
          data-mpangi-module-grid
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
        >
          {filtered.map((item, index) => {
            const Icon = ICONS[item.code] || Grid3X3;
            const accent = ACCENTS[index % ACCENTS.length];

            return (
              <Link
                key={`${item.code}:${item.href}`}
                href={item.href}
                className="group flex min-w-0 flex-col items-center rounded-3xl bg-white p-2.5 text-center shadow-sm ring-1 ring-[#DCEAF5] transition hover:-translate-y-1 hover:shadow-lg sm:p-3"
              >
                <span
                  className={`flex aspect-square w-full max-w-[82px] items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${accent} text-white shadow-md`}
                >
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </span>

                <span className="mt-2 line-clamp-2 min-h-[2.5rem] w-full break-words text-[11px] font-black leading-5 text-[#03357A] sm:text-xs">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-8 text-center">
          <p className="font-black text-[#03357A]">
            Aucun module trouvé
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Vérifiez les permissions du rôle ou modifiez la recherche.
          </p>
        </div>
      )}
    </section>
  );
}
