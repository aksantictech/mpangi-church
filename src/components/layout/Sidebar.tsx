"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Radio,
  Search,
  Shield,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  findActiveMenuGroup,
  getGroupedVisibleMenuItems,
  isActiveMenuItem,
} from "@/lib/modules/moduleRegistry";
import type { ChurchBranding } from "@/lib/tenant/churchBranding";

type MyModulesResponse = {
  role?: string;
  churchId?: string | null;
  moduleCodes?: string[];
};

type SidebarProps = {
  branding: ChurchBranding;
};

const SUPER_ADMIN_ITEMS = [
  {
    label: "Dashboard",
    href: "/super-admin/dashboard",
    icon: Shield,
  },
  {
    label: "Églises",
    href: "/super-admin/churches",
    icon: Shield,
  },
  {
    label: "Modules",
    href: "/super-admin/modules",
    icon: Shield,
  },
  {
    label: "Paramètres",
    href: "/super-admin/settings",
    icon: Shield,
  },
];

const SIDEBAR_COLLAPSED_KEY =
  "mpangi-sidebar-collapsed";

const SIDEBAR_COLLAPSED_EVENT =
  "mpangi:sidebar-collapsed-change";

function readSidebarCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(
        SIDEBAR_COLLAPSED_KEY
      ) === "1"
    );
  } catch {
    return false;
  }
}

function getServerSidebarCollapsed() {
  return false;
}

function subscribeSidebarCollapsed(
  onStoreChange: () => void
) {
  function handleStorage(
    event: StorageEvent
  ) {
    if (
      event.key ===
      SIDEBAR_COLLAPSED_KEY
    ) {
      onStoreChange();
    }
  }

  function handleLocalChange() {
    onStoreChange();
  }

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    SIDEBAR_COLLAPSED_EVENT,
    handleLocalChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      SIDEBAR_COLLAPSED_EVENT,
      handleLocalChange
    );
  };
}

export default function Sidebar({
  branding,
}: SidebarProps) {
  const pathname =
    usePathname() || "/";

  const collapsed =
    useSyncExternalStore(
      subscribeSidebarCollapsed,
      readSidebarCollapsed,
      getServerSidebarCollapsed
    );

  const [
    openKeyPreference,
    setOpenKeyPreference,
  ] = useState<{
    pathname: string;
    key: string;
  } | null>(null);

  const [
    myModules,
    setMyModules,
  ] = useState<MyModulesResponse>({
    moduleCodes: ["dashboard"],
  });

  function setCollapsed(
    nextCollapsed: boolean
  ) {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        nextCollapsed ? "1" : "0"
      );
    } finally {
      window.dispatchEvent(
        new Event(
          SIDEBAR_COLLAPSED_EVENT
        )
      );
    }
  }

  function setOpenKey(key: string) {
    setOpenKeyPreference({
      pathname,
      key,
    });
  }

  useEffect(() => {
    let mounted = true;

    fetch(
      "/api/modules/my-modules",
      {
        cache: "no-store",
        credentials: "include",
      }
    )
      .then(async (response) => {
        const payload =
          (await response.json()) as
            MyModulesResponse;

        if (!response.ok) {
          throw new Error(
            "Modules indisponibles."
          );
        }

        if (!mounted) return;

        setMyModules({
          role: payload.role,
          churchId:
            payload.churchId,
          moduleCodes:
            payload.moduleCodes || [
              "dashboard",
            ],
        });
      })
      .catch(() => {
        if (!mounted) return;

        setMyModules({
          moduleCodes: [
            "dashboard",
          ],
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isSuperAdmin =
    pathname === "/super-admin" ||
    pathname.startsWith(
      "/super-admin/"
    );

  const groups = useMemo(
    () =>
      getGroupedVisibleMenuItems(
        myModules.moduleCodes || [
          "dashboard",
        ]
      ),
    [myModules.moduleCodes]
  );

  const activeOpenKey =
    useMemo(
      () =>
        findActiveMenuGroup(
          groups,
          pathname
        )?.key ?? "system",
      [groups, pathname]
    );

  const openKey =
    openKeyPreference?.pathname ===
    pathname
      ? openKeyPreference.key
      : activeOpenKey;

  if (isSuperAdmin) {
    return (
      <aside className="hidden h-dvh w-[280px] shrink-0 border-r border-[#DCEAF5] bg-white p-3 lg:sticky lg:top-0 lg:block">
        <div className="rounded-[1.6rem] bg-[#03357A] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>

          <h2 className="mt-2 text-xl font-black">
            Super admin
          </h2>

          <p className="mt-1 text-xs font-semibold text-blue-100">
            Administration globale
          </p>
        </div>

        <nav className="mt-4 space-y-1.5">
          {SUPER_ADMIN_ITEMS.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                isActiveMenuItem(
                  pathname,
                  item.href
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition",
                    active
                      ? "bg-[#03357A] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            }
          )}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={[
        "hidden h-dvh shrink-0 border-r border-[#DCEAF5] bg-[var(--church-surface)] transition-all duration-300 lg:sticky lg:top-0 lg:block",
        collapsed
          ? "w-[86px]"
          : "w-[286px]",
      ].join(" ")}
    >
      <div className="flex h-full flex-col p-3">
        <div
          className={[
            "rounded-[1.5rem] bg-gradient-to-br from-[var(--church-primary)] via-[var(--church-secondary)] to-[var(--church-accent)] text-white shadow-sm",
            collapsed
              ? "p-3"
              : "p-4",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center",
              collapsed
                ? "justify-center"
                : "justify-between gap-3",
            ].join(" ")}
          >
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-3"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-sm font-black"
                title={branding.name}
              >
                {branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      branding.logoUrl
                    }
                    alt={`Logo ${branding.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  branding.shortName
                )}
              </span>

              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black uppercase tracking-[0.18em] text-white/75">
                    {
                      branding.shortName
                    }
                  </span>

                  <span className="mt-1 block truncate text-lg font-black">
                    {branding.name}
                  </span>
                </span>
              )}
            </Link>

            {!collapsed && (
              <button
                type="button"
                onClick={() =>
                  setCollapsed(
                    true
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                aria-label="Réduire le menu"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() =>
                setCollapsed(false)
              }
              className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
              aria-label="Ouvrir le menu"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <Link
          href="/live"
          className={[
            "mt-3 flex min-h-12 items-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-900/20 transition hover:bg-red-700",
            collapsed
              ? "justify-center px-3"
              : "gap-3 px-4",
          ].join(" ")}
          title="Culte en direct"
        >
          <Radio className="h-5 w-5 shrink-0 animate-pulse" />

          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">
                Culte en direct
              </span>

              <span className="block truncate text-[11px] font-semibold text-red-100">
                Regarder dans
                l’application
              </span>
            </span>
          )}
        </Link>

        {!collapsed && (
          <Link
            href="/mobile-menu"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-[var(--church-primary)]/30 hover:bg-[#EAF3FA] hover:text-[var(--church-primary)]"
          >
            <Search className="h-4 w-4" />
            Rechercher un module
          </Link>
        )}

        <nav className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            {groups.map(
              (group) => {
                const GroupIcon =
                  group.icon;

                const isOpen =
                  openKey ===
                  group.key;

                const hasActiveItem =
                  group.items.some(
                    (item) =>
                      isActiveMenuItem(
                        pathname,
                        item.href
                      )
                  );

                if (collapsed) {
                  return (
                    <button
                      key={
                        group.key
                      }
                      type="button"
                      onClick={() => {
                        setCollapsed(
                          false
                        );

                        setOpenKey(
                          group.key
                        );
                      }}
                      className={[
                        "flex h-12 w-full items-center justify-center rounded-2xl transition",
                        hasActiveItem
                          ? "bg-[var(--church-primary)] text-white"
                          : "text-slate-500 hover:bg-[#EAF3FA] hover:text-[var(--church-primary)]",
                      ].join(" ")}
                      title={
                        group.title
                      }
                    >
                      <GroupIcon className="h-5 w-5" />
                    </button>
                  );
                }

                return (
                  <div
                    key={group.key}
                    className="rounded-2xl"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenKey(
                          isOpen
                            ? ""
                            : group.key
                        )
                      }
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                        hasActiveItem ||
                        isOpen
                          ? "bg-[#EAF3FA] text-[var(--church-primary)]"
                          : "text-slate-600 hover:bg-[#F8FBFD] hover:text-[var(--church-primary)]",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            hasActiveItem ||
                            isOpen
                              ? "bg-white"
                              : "bg-[#F8FBFD]",
                          ].join(" ")}
                        >
                          <GroupIcon className="h-4 w-4" />
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">
                            {
                              group.title
                            }
                          </span>

                          <span className="block truncate text-[11px] font-semibold text-slate-500">
                            {
                              group.description
                            }
                          </span>
                        </span>
                      </span>

                      <ChevronDown
                        className={[
                          "h-4 w-4 shrink-0 transition",
                          isOpen
                            ? "rotate-180"
                            : "",
                        ].join(" ")}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1.5 space-y-1 pl-3">
                        {group.items.map(
                          (item) => {
                            const ItemIcon =
                              item.icon;

                            const active =
                              isActiveMenuItem(
                                pathname,
                                item.href
                              );

                            return (
                              <Link
                                key={`${group.key}-${item.href}`}
                                href={
                                  item.href
                                }
                                className={[
                                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                                  active
                                    ? "bg-[var(--church-primary)] text-white shadow-sm"
                                    : "text-slate-600 hover:bg-[#F8FBFD] hover:text-[var(--church-primary)]",
                                ].join(
                                  " "
                                )}
                              >
                                <ItemIcon className="h-4 w-4 shrink-0" />

                                <span className="truncate">
                                  {
                                    item.label
                                  }
                                </span>
                              </Link>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}