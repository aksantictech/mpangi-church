"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  findActiveMenuGroup,
  getGroupedVisibleMenuItems,
  isActiveMenuItem,
} from "@/lib/modules/moduleRegistry";

type MyModulesResponse = {
  role?: string;
  churchId?: string | null;
  moduleCodes?: string[];
};

const FALLBACK_MODULES = [
  "dashboard",
  "settings",
  "notifications",
];

export default function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("system");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [myModules, setMyModules] = useState<MyModulesResponse>({
    moduleCodes: FALLBACK_MODULES,
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/modules/my-modules", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;

        setMyModules({
          role: payload.role,
          churchId: payload.churchId,
          moduleCodes:
            payload.moduleCodes || FALLBACK_MODULES,
        });
      })
      .catch(() => {
        if (mounted) {
          setMyModules({ moduleCodes: FALLBACK_MODULES });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(
    () =>
      getGroupedVisibleMenuItems(
        myModules.moduleCodes || FALLBACK_MODULES
      ),
    [myModules.moduleCodes]
  );

  useEffect(() => {
    const activeGroup = findActiveMenuGroup(groups, pathname);

    if (activeGroup) setOpenGroup(activeGroup.key);
  }, [groups, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function openMenu() {
      setOpen(true);
    }

    window.addEventListener(
      "mpangi:open-mobile-menu",
      openMenu
    );

    return () =>
      window.removeEventListener(
        "mpangi:open-mobile-menu",
        openMenu
      );
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  async function handleLogout() {
    try {
      setLogoutLoading(true);
      await fetch("/logout", {
        method: "POST",
        cache: "no-store",
      });
      router.replace("/login?logout=1");
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <>
      <header
        data-mpangi-church-mobile-topbar
        className="sticky top-0 z-[60] border-b border-[#DCEAF5] bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Mpangi-church
            </p>
            <p className="truncate text-base font-black text-[#03357A]">
              Espace église
            </p>
          </Link>

          <Link
            href="/notifications"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#DCEAF5] bg-white text-[#03357A]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <aside
            data-mpangi-church-mobile-drawer
            className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[360px] flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="shrink-0 border-b border-[#DCEAF5] p-4">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/dashboard"
                  className="flex min-w-0 items-center gap-3"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#03357A] text-sm font-black text-white">
                    MC
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Mpangi-church
                    </span>
                    <span className="block truncate text-lg font-black text-[#03357A]">
                      Tous les modules
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <Link
                href="/modules"
                className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 py-3 text-sm font-bold text-slate-600"
              >
                <Search className="h-4 w-4" />
                Lanceur d’applications
              </Link>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {groups.map((group) => {
                  const GroupIcon = group.icon;
                  const isOpen = openGroup === group.key;
                  const hasActiveItem = group.items.some((item) =>
                    isActiveMenuItem(pathname, item.href)
                  );

                  return (
                    <section
                      key={group.key}
                      className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroup(isOpen ? "" : group.key)
                        }
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                          hasActiveItem || isOpen
                            ? "bg-[#EAF3FA] text-[#03357A]"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#03357A]">
                            <GroupIcon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black">
                              {group.title}
                            </span>
                            <span className="block truncate text-xs font-semibold text-slate-500">
                              {group.description}
                            </span>
                          </span>
                        </span>

                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="space-y-1 p-3 pt-1">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const active = isActiveMenuItem(
                              pathname,
                              item.href
                            );

                            return (
                              <Link
                                key={`${group.key}-${item.href}`}
                                href={item.href}
                                className={`flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold ${
                                  active
                                    ? "bg-[#03357A] text-white"
                                    : "text-slate-600 hover:bg-[#F8FBFD] hover:text-[#03357A]"
                                }`}
                              >
                                <ItemIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {item.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 border-t border-[#DCEAF5] p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 text-sm font-extrabold text-[#03357A]"
                >
                  <Home className="h-4 w-4" />
                  Accueil
                </Link>
                <Link
                  href="/settings"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 text-sm font-extrabold text-[#03357A]"
                >
                  <Settings className="h-4 w-4" />
                  Réglages
                </Link>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-extrabold text-red-700 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {logoutLoading
                  ? "Déconnexion..."
                  : "Déconnexion"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
