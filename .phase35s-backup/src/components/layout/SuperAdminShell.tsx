"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Boxes,
  Rocket,
  Building2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import SuperAdminTopBar from "@/components/layout/SuperAdminTopBar";

const menuItems = [
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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="p-4">
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

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                active
                  ? "bg-[#03357A] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function SuperAdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F9FC]">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[292px] border-r border-[#DCEAF5] lg:block">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />

          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px] shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[292px]">
        <SuperAdminTopBar onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
