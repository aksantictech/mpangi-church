"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Boxes,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
} from "lucide-react";

const items = [
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
    label: "Modules",
    href: "/super-admin/modules",
    icon: Boxes,
  },
  {
    label: "Paramètres",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SuperAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[#F5F9FC] text-[#0F172A] lg:flex">
      <aside className="hidden h-dvh w-[280px] shrink-0 border-r border-[#DCEAF5] bg-white p-3 lg:sticky lg:top-0 lg:block">
        <div className="rounded-[1.6rem] bg-[#03357A] p-5 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Shield className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>
          <h2 className="mt-2 text-xl font-black">Super admin</h2>
          <p className="mt-1 text-xs font-semibold text-blue-100">
            Administration globale
          </p>
        </div>

        <nav className="mt-4 space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

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

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-[#DCEAF5] bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/super-admin/dashboard" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#03357A] text-white">
                <Shield className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-[#03357A]">
                  Super admin
                </span>
                <span className="block text-xs font-semibold text-slate-500">
                  Menu simplifié
                </span>
              </span>
            </Link>

            <Link
              href="/super-admin/settings"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"
              aria-label="Paramètres"
            >
              <Menu className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="px-3 pb-8 pt-4 sm:px-5 lg:px-8 lg:pt-5">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </section>
    </div>
  );
}
