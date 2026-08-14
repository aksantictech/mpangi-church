"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  Menu,
  QrCode,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MyModulesResponse = {
  moduleCodes?: string[];
};

const ITEMS = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
    moduleCode: "dashboard",
  },
  {
    label: "Membres",
    href: "/members",
    icon: UsersRound,
    moduleCode: "members",
  },
  {
    label: "Scanner",
    href: "/attendance/scanner",
    icon: QrCode,
    moduleCode: "attendance",
    featured: true,
  },
  {
    label: "Notifs",
    href: "/notifications",
    icon: Bell,
    moduleCode: "notifications",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function MobileBottomNav() {
  const pathname =
    usePathname() || "/dashboard";
  const [moduleCodes, setModuleCodes] = useState<string[]>(["dashboard"]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/modules/my-modules", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Modules indisponibles.");
        return response.json() as Promise<MyModulesResponse>;
      })
      .then((payload) => {
        if (mounted) setModuleCodes(payload.moduleCodes || ["dashboard"]);
      })
      .catch(() => {
        if (mounted) setModuleCodes(["dashboard"]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const allowed = new Set(moduleCodes);
    return ITEMS.filter((item) => allowed.has(item.moduleCode));
  }, [moduleCodes]);

  function openMobileMenu() {
    window.dispatchEvent(
      new CustomEvent("mpangi:open-mobile-menu")
    );
  }

  return (
    <nav
      data-mpangi-church-mobile-nav
      role="navigation"
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(env(safe-area-inset-bottom),0.65rem)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end gap-1.5 rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_-8px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl">

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(
            pathname,
            item.href
          );

          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className="group relative -mt-8 flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span
                  className={[
                    "flex h-[3.8rem] w-[3.8rem]",
                    "items-center justify-center",
                    "rounded-full border-[5px]",
                    "border-white shadow-xl",
                    "transition-transform",
                    "group-active:scale-95",
                    active
                      ? "bg-[#03357A] text-white"
                      : "bg-[#2563EB] text-white",
                  ].join(" ")}
                >
                  <Icon className="h-6 w-6" />
                </span>

                <span className="mt-1 text-[10px] font-black text-[#03357A]">
                  Scanner
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={[
                "flex min-h-14 min-w-0 flex-1",
                "flex-col items-center justify-center",
                "gap-1 rounded-2xl px-1",
                "text-center text-[10px] font-black",
                "transition-all",
                active
                  ? "bg-[#EAF3FA] text-[#03357A]"
                  : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openMobileMenu}
          aria-label="Ouvrir le menu"
          className="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[10px] font-black text-slate-500 transition hover:bg-slate-50"
        >
          <Menu className="h-5 w-5" />

          <span>
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
