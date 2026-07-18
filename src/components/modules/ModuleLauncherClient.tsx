"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileText,
  Grid3X3,
  HandCoins,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Network,
  PackageSearch,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UsersRound,
  Wallet,
  Wrench,
} from "lucide-react";

import {
  MODULE_CATEGORIES,
  resolveModuleCategory,
  type ModuleCategoryCode,
} from "@/lib/modules/moduleCatalog";

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
  error?: string;
};

type ModulePreferences = {
  favorites: string[];
  recent: string[];
};

type FilterCode = "all" | "favorites" | "recent" | ModuleCategoryCode;

const ICONS: Record<string, LucideIcon> = {
  role_dashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  my_work: BriefcaseBusiness,
  members: UsersRound,
  attendance: QrCode,
  souls: HeartHandshake,
  departments: Network,
  events: CalendarDays,
  appointments: CalendarDays,
  testimonies: HeartHandshake,
  public_requests: ClipboardCheck,
  teachings: BookOpen,
  publications: FileText,
  notifications: Bell,
  correspondence: FileText,
  inbox: FileText,
  transmissions: FileText,
  tasks: ClipboardCheck,
  minutes: FileText,
  administration: Building2,
  finance_dashboard: Wallet,
  offerings: HandCoins,
  expenses: CircleDollarSign,
  budgets: ChartNoAxesCombined,
  finance_reports: Landmark,
  donations: HandCoins,
  patrimony: Building2,
  reports: BarChart3,
  assets: PackageSearch,
  maintenance: Wrench,
  movements: Boxes,
  extensions: Network,
  users: UsersRound,
  security: ShieldCheck,
  settings: Settings,
};

const STORAGE_KEY = "mpangi-module-preferences-v1";
const PREFERENCES_EVENT = "mpangi-module-preferences-change";
const EMPTY_PREFERENCES = JSON.stringify({
  favorites: [],
  recent: [],
} satisfies ModulePreferences);

function getStorageSnapshot() {
  if (typeof window === "undefined") return EMPTY_PREFERENCES;

  return window.localStorage.getItem(STORAGE_KEY) || EMPTY_PREFERENCES;
}

function subscribeToPreferences(callback: () => void) {
  function handleStorage(event: StorageEvent) {
    if (!event.key || event.key === STORAGE_KEY) callback();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PREFERENCES_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PREFERENCES_EVENT, callback);
  };
}

function parsePreferences(snapshot: string): ModulePreferences {
  try {
    const value = JSON.parse(snapshot) as Partial<ModulePreferences>;

    return {
      favorites: Array.isArray(value.favorites)
        ? value.favorites.filter(
            (code): code is string => typeof code === "string",
          )
        : [],
      recent: Array.isArray(value.recent)
        ? value.recent.filter(
            (code): code is string => typeof code === "string",
          )
        : [],
    };
  } catch {
    return {
      favorites: [],
      recent: [],
    };
  }
}

function savePreferences(preferences: ModulePreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

function useModulePreferences() {
  const snapshot = useSyncExternalStore(
    subscribeToPreferences,
    getStorageSnapshot,
    () => EMPTY_PREFERENCES,
  );

  return useMemo(() => parsePreferences(snapshot), [snapshot]);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Impossible de charger les modules.";
}

export default function ModuleLauncherClient() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCode>("all");
  const preferences = useModulePreferences();

  useEffect(() => {
    const controller = new AbortController();

    async function loadNavigation() {
      try {
        const response = await fetch("/api/security/navigation", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        const payload = (await response.json()) as Payload;

        if (!response.ok) {
          throw new Error(payload.error || "Navigation indisponible.");
        }

        if (!controller.signal.aborted) {
          setItems(
            Array.isArray(payload.data?.items) ? payload.data.items : [],
          );
          setError("");
        }
      } catch (loadError: unknown) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadNavigation();

    return () => controller.abort();
  }, []);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        categoryInfo: resolveModuleCategory(item.code, item.category),
      })),
    [items],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<ModuleCategoryCode, number>();

    for (const item of enrichedItems) {
      counts.set(
        item.categoryInfo.code,
        (counts.get(item.categoryInfo.code) || 0) + 1,
      );
    }

    return counts;
  }, [enrichedItems]);

  const visibleCategories = useMemo(
    () =>
      MODULE_CATEGORIES.filter(
        (category) => (categoryCounts.get(category.code) || 0) > 0,
      ).sort((left, right) => left.order - right.order),
    [categoryCounts],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    const recentPosition = new Map(
      preferences.recent.map((code, index) => [code, index]),
    );

    const result = enrichedItems.filter((item) => {
      const matchesSearch =
        !term ||
        `${item.label} ${item.code} ${item.categoryInfo.label}`
          .toLocaleLowerCase("fr")
          .includes(term);

      if (!matchesSearch) return false;
      if (activeFilter === "favorites") {
        return preferences.favorites.includes(item.code);
      }
      if (activeFilter === "recent") {
        return recentPosition.has(item.code);
      }
      if (activeFilter !== "all") {
        return item.categoryInfo.code === activeFilter;
      }

      return true;
    });

    return result.sort((left, right) => {
      if (activeFilter === "recent") {
        return (
          (recentPosition.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
          (recentPosition.get(right.code) ?? Number.MAX_SAFE_INTEGER)
        );
      }

      const categoryDifference =
        left.categoryInfo.order - right.categoryInfo.order;

      if (categoryDifference !== 0) return categoryDifference;
      return left.label.localeCompare(right.label, "fr");
    });
  }, [activeFilter, enrichedItems, preferences, query]);

  function toggleFavorite(moduleCode: string) {
    const isFavorite = preferences.favorites.includes(moduleCode);

    savePreferences({
      ...preferences,
      favorites: isFavorite
        ? preferences.favorites.filter((code) => code !== moduleCode)
        : [moduleCode, ...preferences.favorites],
    });
  }

  function rememberModule(moduleCode: string) {
    savePreferences({
      ...preferences,
      recent: [
        moduleCode,
        ...preferences.recent.filter((code) => code !== moduleCode),
      ].slice(0, 8),
    });
  }

  const filters: Array<{
    code: FilterCode;
    label: string;
    count: number;
    icon?: LucideIcon;
  }> = [
    { code: "all", label: "Tous", count: items.length, icon: Grid3X3 },
    {
      code: "favorites",
      label: "Favoris",
      count: preferences.favorites.filter((code) =>
        items.some((item) => item.code === code),
      ).length,
      icon: Star,
    },
    {
      code: "recent",
      label: "Récents",
      count: preferences.recent.filter((code) =>
        items.some((item) => item.code === code),
      ).length,
      icon: Clock3,
    },
    ...visibleCategories.map((category) => ({
      code: category.code,
      label: category.label,
      count: categoryCounts.get(category.code) || 0,
    })),
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-7">
        <Grid3X3 className="h-8 w-8" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
          Lanceur d’applications
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Mes modules</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Retrouvez les fonctions autorisées pour votre rôle, puis épinglez vos
          outils préférés.
        </p>
      </div>

      <div className="space-y-3 rounded-3xl border border-[#DCEAF5] bg-white p-3 shadow-sm sm:p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un module..."
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] pl-12 pr-4 text-base font-semibold outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          />
        </label>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Filtres des modules"
        >
          {filters.map((filter) => {
            const FilterIcon = filter.icon;
            const active = activeFilter === filter.code;

            return (
              <button
                key={filter.code}
                type="button"
                onClick={() => setActiveFilter(filter.code)}
                aria-pressed={active}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black transition ${
                  active
                    ? "bg-[#03357A] text-white shadow-sm"
                    : "bg-[#F2F7FB] text-[#03357A] hover:bg-[#E4EFF8]"
                }`}
              >
                {FilterIcon && <FilterIcon className="h-4 w-4" />}
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    active ? "bg-white/20" : "bg-white text-slate-500"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
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
          {filtered.map((item) => {
            const Icon = ICONS[item.code] || Grid3X3;
            const favorite = preferences.favorites.includes(item.code);

            return (
              <article
                key={`${item.code}:${item.href}`}
                className="group relative flex min-w-0 flex-col rounded-3xl bg-white p-2.5 text-center shadow-sm ring-1 ring-[#DCEAF5] transition hover:-translate-y-1 hover:shadow-lg sm:p-3"
              >
                <button
                  type="button"
                  onClick={() => toggleFavorite(item.code)}
                  aria-label={
                    favorite
                      ? `Retirer ${item.label} des favoris`
                      : `Ajouter ${item.label} aux favoris`
                  }
                  aria-pressed={favorite}
                  className={`absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-1 transition ${
                    favorite
                      ? "bg-amber-50 text-amber-600 ring-amber-200"
                      : "bg-white/95 text-slate-400 ring-slate-200 hover:text-amber-600"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${favorite ? "fill-current" : ""}`}
                  />
                </button>

                <Link
                  href={item.href}
                  onClick={() => rememberModule(item.code)}
                  className="flex min-w-0 flex-1 flex-col items-center"
                >
                  <span
                    className={`flex aspect-square w-full max-w-[82px] items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${item.categoryInfo.accent} text-white shadow-md`}
                  >
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </span>

                  <span className="mt-2 line-clamp-2 min-h-[2.5rem] w-full break-words text-[11px] font-black leading-5 text-[#03357A] sm:text-xs">
                    {item.label}
                  </span>

                  <span className="mt-1 hidden max-w-full truncate text-[10px] font-bold text-slate-400 sm:block">
                    {item.categoryInfo.label}
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-8 text-center">
          <p className="font-black text-[#03357A]">Aucun module trouvé</p>
          <p className="mt-2 text-sm text-slate-500">
            Modifiez la recherche ou sélectionnez une autre catégorie.
          </p>
        </div>
      )}
    </section>
  );
}
