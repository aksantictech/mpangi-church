"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AppWindow,
  Boxes,
  Building2,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Rocket,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import SuperAdminTopBar from "@/components/layout/SuperAdminTopBar";

const desktopItems = [
  {
    label: "Dashboard",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Églises",
    href: "/super-admin/churches",
    icon: Building2,
  },
  {
    label: "Applications",
    href: "/super-admin/apps",
    icon: AppWindow,
  },
  {
    label: "Utilisateurs",
    href: "/super-admin/users",
    icon: UsersRound,
  },
  {
    label: "Gestion modules",
    href: "/super-admin/modules",
    icon: Boxes,
  },
  {
    label: "Onboarding",
    href: "/super-admin/onboarding",
    icon: Rocket,
  },
  {
    label: "Paramètres",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

const mobileMainItems = desktopItems.slice(0, 4);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-mpangi-superadmin-sidebar
      className="flex h-full min-h-0 flex-col border-r border-[#DCEAF5] bg-white"
    >
      <div className="shrink-0 p-4">
        <div className="rounded-[2rem] bg-[#03357A] p-5 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.35em]">
            Mpangi-church
          </p>
          <h2 className="mt-4 text-2xl font-black">Super admin</h2>
          <p className="mt-1 text-sm font-bold text-blue-100">
            Administration globale
          </p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-5">
        {desktopItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-[#03357A] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function SuperAdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);


  useEffect(() => {
    if (!moreOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [moreOpen]);

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
    <div
      data-mpangi-superadmin-shell
      className="min-h-dvh overflow-x-hidden bg-[#F5F9FC]"
    >
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[292px] lg:block">
        <DesktopSidebar />
      </div>

      <div className="min-w-0 lg:pl-[292px]">
        <SuperAdminTopBar
          onOpenMobileMenu={() => setMoreOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1500px] px-3 py-5 pb-28 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav
        data-mpangi-superadmin-mobile-nav
        aria-label="Navigation Super Admin mobile"
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#DCEAF5] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black ${
                  active
                    ? "bg-[#03357A] text-white"
                    : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">
                  {item.label === "Applications"
                    ? "Apps"
                    : item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black text-slate-500"
          >
            <MoreHorizontal className="h-5 w-5" />
            Plus
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <section
            data-mpangi-superadmin-more-sheet
            className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[2rem] bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Super Admin
                </p>
                <h2 className="text-xl font-black text-[#03357A]">
                  Plus d’options
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {desktopItems.slice(4).map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                     onClick={() => setMoreOpen(false)}
                    className="flex min-h-24 flex-col justify-between rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-[#03357A]"
                  >
                    <Icon className="h-6 w-6" />
                    <span className="mt-4 break-words text-sm font-black">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              <Link
                href="/super-admin/profile"
                 onClick={() => setMoreOpen(false)}
                className="flex min-h-24 flex-col justify-between rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-[#03357A]"
              >
                <UserRound className="h-6 w-6" />
                <span className="mt-4 text-sm font-black">Profil</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-700 disabled:opacity-60"
            >
              <LogOut className="h-5 w-5" />
              {logoutLoading ? "Déconnexion..." : "Déconnexion"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
