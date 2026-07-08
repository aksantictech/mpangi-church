"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Search,
  Shield,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  findActiveMenuGroup,
  getGroupedVisibleMenuItems,
  isActiveMenuItem,
  type ModuleMenuGroup,
} from "@/lib/modules/moduleRegistry";

type MyModulesResponse = {
  role?: string;
  churchId?: string | null;
  moduleCodes?: string[];
};

const SUPER_ADMIN_ITEMS = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: Shield },
  { label: "Églises", href: "/super-admin/churches", icon: Shield },
  { label: "Utilisateurs", href: "/super-admin/users", icon: UsersRound },
  { label: "Modules", href: "/super-admin/modules", icon: Shield },
  { label: "Paramètres", href: "/super-admin/settings", icon: Shield },
];

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

function addAdminUserPermissionItem(groups: ModuleMenuGroup[], role: string) {
  if (!ADMIN_ROLES.has(role)) return groups;

  return groups.map((group) => {
    if (group.key !== "system") return group;

    const alreadyExists = group.items.some((item) => item.href === "/settings/users");

    if (alreadyExists) return group;

    return {
      ...group,
      items: [
        ...group.items,
        {
          code: "user_permissions",
          label: "Utilisateurs & rôles",
          href: "/settings/users",
          icon: UsersRound,
          category: "system" as const,
        },
      ],
    };
  });
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openKey, setOpenKey] = useState<string>("system");
  const [myModules, setMyModules] = useState<MyModulesResponse>({
    moduleCodes: ["dashboard"],
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("mpangi-sidebar-collapsed");
    setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mpangi-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/modules/my-modules", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        setMyModules({
          role: payload.role,
          churchId: payload.churchId,
          moduleCodes: payload.moduleCodes || ["dashboard"],
        });
      })
      .catch(() => {
        if (!mounted) return;
        setMyModules({ moduleCodes: ["dashboard"] });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const role = String(myModules.role || "").toLowerCase();
  const isSuperAdmin = pathname.startsWith("/super-admin");

  const groups = useMemo(() => {
    const baseGroups = getGroupedVisibleMenuItems(myModules.moduleCodes || ["dashboard"]);
    return addAdminUserPermissionItem(baseGroups, role);
  }, [myModules.moduleCodes, role]);

  useEffect(() => {
    const activeGroup = findActiveMenuGroup(groups, pathname);
    if (activeGroup) setOpenKey(activeGroup.key);
  }, [groups, pathname]);

  if (isSuperAdmin) {
    return (
      <aside className="hidden h-dvh w-[280px] shrink-0 border-r border-[#DCEAF5] bg-white p-3 lg:sticky lg:top-0 lg:block">
        <div className="rounded-[1.6rem] bg-[#03357A] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>
          <h2 className="mt-2 text-xl font-black">Super admin</h2>
        </div>

        <nav className="mt-4 space-y-1.5">
          {SUPER_ADMIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActiveMenuItem(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  active
                    ? "bg-[#03357A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={`hidden h-dvh shrink-0 border-r border-[#DCEAF5] bg-white transition-all duration-300 lg:sticky lg:top-0 lg:block ${
        collapsed ? "w-[86px]" : "w-[286px]"
      }`}
    >
      <div className="flex h-full flex-col p-3">
        <div
          className={`rounded-[1.5rem] bg-[#03357A] text-white shadow-sm ${
            collapsed ? "p-3" : "p-4"
          }`}
        >
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black">
                MC
              </span>

              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Mpangi-church
                  </span>
                  <span className="mt-1 block truncate text-lg font-black">
                    Espace église
                  </span>
                </span>
              )}
            </Link>

            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
                aria-label="Réduire le menu"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="Ouvrir le menu"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && (
          <Link
            href="/mobile-menu"
            className="mt-3 flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-500 transition hover:border-[#03357A]/30 hover:bg-[#EAF3FA] hover:text-[#03357A]"
          >
            <Search className="h-4 w-4" />
            Rechercher un module
          </Link>
        )}

        <nav className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#DCEAF5]">
          <div className="space-y-1.5">
            {groups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openKey === group.key;
              const hasActiveItem = group.items.some((item) =>
                isActiveMenuItem(pathname, item.href)
              );

              if (collapsed) {
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => {
                      setCollapsed(false);
                      setOpenKey(group.key);
                    }}
                    className={`flex h-12 w-full items-center justify-center rounded-2xl transition ${
                      hasActiveItem
                        ? "bg-[#03357A] text-white"
                        : "text-slate-500 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                    }`}
                    title={group.title}
                  >
                    <GroupIcon className="h-5 w-5" />
                  </button>
                );
              }

              return (
                <div key={group.key} className="rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? "" : group.key)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      hasActiveItem || isOpen
                        ? "bg-[#EAF3FA] text-[#03357A]"
                        : "text-slate-600 hover:bg-[#F8FBFD] hover:text-[#03357A]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          hasActiveItem || isOpen ? "bg-white" : "bg-[#F8FBFD]"
                        }`}
                      >
                        <GroupIcon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">
                          {group.title}
                        </span>
                        <span className="block truncate text-[11px] font-semibold text-slate-500">
                          {group.description}
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-1.5 space-y-1 pl-3">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isActiveMenuItem(pathname, item.href);

                        return (
                          <Link
                            key={`${group.key}-${item.href}`}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                              active
                                ? "bg-[#03357A] text-white shadow-sm"
                                : "text-slate-600 hover:bg-[#F8FBFD] hover:text-[#03357A]"
                            }`}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {!collapsed && (
          <div className="mt-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Session
            </p>
            <Link
              href="/logout"
              className="mt-2 flex items-center gap-2 text-sm font-extrabold text-slate-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
