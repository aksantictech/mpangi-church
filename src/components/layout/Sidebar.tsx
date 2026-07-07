"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Church,
  ClipboardCheck,
  Download,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  PackageCheck,
  PieChart,
  QrCode,
  ReceiptText,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  TestTube2,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppLogo from "@/components/brand/AppLogo";
import {
  getGroupedVisibleMenuItems,
  type ModuleCategory,
  type ModuleMenuGroup,
  type ModuleMenuItem,
} from "@/lib/modules/moduleRegistry";

const ICONS: Record<string, LucideIcon> = {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarCheck,
  CalendarDays,
  Church,
  ClipboardCheck,
  Download,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  PackageCheck,
  PieChart,
  QrCode,
  ReceiptText,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  TestTube2,
  Users,
  Wallet,
  Warehouse,
  Wrench,
};

const GROUP_ICONS: Record<ModuleCategory, LucideIcon> = {
  system: Settings,
  spiritual: HeartHandshake,
  administration: Inbox,
  finance: Wallet,
  patrimony: Warehouse,
};

const superAdminItems = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: Home },
  { label: "Églises", href: "/super-admin/churches", icon: Building2 },
  { label: "Utilisateurs", href: "/super-admin/users", icon: Users },
  { label: "Modules", href: "/super-admin/modules", icon: LayoutGrid },
  { label: "Paramètres", href: "/super-admin/settings", icon: Settings },
];

function isActivePath(pathname: string, item: ModuleMenuItem) {
  if (item.activePaths) {
    return item.activePaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isSuperAdminActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContainsActivePath(pathname: string, group: ModuleMenuGroup) {
  return group.items.some((item) => isActivePath(pathname, item));
}

function SuperAdminSidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="border-b border-[#DCEAF5] px-5 py-5">
        <AppLogo imageSize={48} />
      </div>

      <div className="px-4 py-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm font-semibold text-blue-100">Espace</p>
          <h2 className="mt-1 text-2xl font-black">Super Admin</h2>

          <p className="mt-3 text-sm leading-6 text-blue-50">
            Gestion globale de la plateforme Mpangi-church.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5">
        {superAdminItems.map((item) => {
          const Icon = item.icon;
          const isActive = isSuperAdminActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-gradient-to-r from-[#03357A] to-[#2563EB] text-white shadow-lg shadow-blue-900/15"
                  : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-[#F5F9FC] text-slate-500 group-hover:bg-white group-hover:text-[#03357A]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-3xl border border-[#DCEAF5] bg-gradient-to-br from-white to-[#F5F9FC] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <LayoutGrid className="h-6 w-6" />
            </div>

            <div>
              <p className="font-extrabold text-[#03357A]">AKSANTIC</p>
              <p className="text-xs font-semibold text-slate-500">
                Technology Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ChurchSidebarContent({ pathname }: { pathname: string }) {
  const [moduleCodes, setModuleCodes] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadModules() {
      try {
        const response = await fetch("/api/modules/my-modules", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) setIsLoaded(true);
          return;
        }

        const payload = await response.json();

        if (isMounted) {
          setModuleCodes(
            Array.isArray(payload.moduleCodes) ? payload.moduleCodes : []
          );
          setIsLoaded(true);
        }
      } catch {
        if (isMounted) setIsLoaded(true);
      }
    }

    loadModules();

    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(() => getGroupedVisibleMenuItems(moduleCodes), [moduleCodes]);

  useEffect(() => {
    if (!isLoaded) return;

    const nextOpenGroups: Record<string, boolean> = {};
    for (const group of groups) {
      nextOpenGroups[group.category] =
        group.category === "system" || groupContainsActivePath(pathname, group);
    }

    setOpenGroups((current) => ({
      ...nextOpenGroups,
      ...Object.fromEntries(
        Object.entries(current).filter(([key]) =>
          groups.some((group) => group.category === key)
        )
      ),
    }));
  }, [groups, isLoaded, pathname]);

  function toggleGroup(category: string) {
    setOpenGroups((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <>
      <div className="border-b border-[#DCEAF5] px-5 py-5">
        <AppLogo imageSize={48} />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {!isLoaded ? (
          <div className="space-y-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-2xl bg-[#F5F9FC]"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const GroupIcon = GROUP_ICONS[group.category] || LayoutGrid;
              const isOpen = Boolean(openGroups[group.category]);
              const hasActiveItem = groupContainsActivePath(pathname, group);

              return (
                <div
                  key={group.category}
                  className={`rounded-3xl border transition ${
                    hasActiveItem
                      ? "border-[#2563EB]/30 bg-[#F8FBFD]"
                      : "border-[#DCEAF5] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.category)}
                    className="flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        hasActiveItem
                          ? "bg-[#03357A] text-white"
                          : "bg-[#EAF3FA] text-[#03357A]"
                      }`}
                    >
                      <GroupIcon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-[#03357A]">
                        {group.title}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-500">
                        {group.items.length} module(s)
                      </span>
                    </span>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                        isOpen ? "rotate-180 text-[#03357A]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-1 px-3 pb-3">
                      {group.items.map((item) => {
                        const Icon = ICONS[item.iconKey] || Home;
                        const isActive = isActivePath(pathname, item);

                        return (
                          <Link
                            key={`${item.code}-${item.href}`}
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                              isActive
                                ? "bg-gradient-to-r from-[#03357A] to-[#2563EB] text-white shadow-lg shadow-blue-900/15"
                                : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                isActive
                                  ? "bg-white/15 text-white"
                                  : "bg-[#F5F9FC] text-slate-500 group-hover:bg-white group-hover:text-[#03357A]"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            <span className="truncate">{item.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4">
        <div className="rounded-3xl border border-[#DCEAF5] bg-gradient-to-br from-white to-[#F5F9FC] p-5 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1E8FF] text-2xl text-[#8B5CF6]">
            “
          </div>

          <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
            Que tout ce que vous faites soit fait avec amour.
          </p>

          <p className="mt-3 text-sm font-bold text-[#8B5CF6]">
            1 Corinthiens 16:14
          </p>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isSuperAdminArea = pathname.startsWith("/super-admin");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#DCEAF5] bg-white/95 shadow-sm backdrop-blur lg:block">
      <div className="flex h-full flex-col">
        {isSuperAdminArea ? (
          <SuperAdminSidebarContent pathname={pathname} />
        ) : (
          <ChurchSidebarContent pathname={pathname} />
        )}
      </div>
    </aside>
  );
}
