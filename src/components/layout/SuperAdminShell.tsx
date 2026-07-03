"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "@/components/account/AccountMenu";
import HeaderActions from "@/components/layout/HeaderActions";
import {
  Building2,
  Church,
  Home,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import AppLogo from "@/components/brand/AppLogo";

type SuperAdminShellProps = {
  children: ReactNode;
};

const menuItems = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: Home },
  { label: "Églises", href: "/super-admin/churches", icon: Church },
  { label: "Utilisateurs", href: "/super-admin/users", icon: Users },
  { label: "Paramètres", href: "/super-admin/settings", icon: Settings },
];

export default function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F5F9FC] text-[#0F172A]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#DCEAF5] bg-white/95 shadow-sm backdrop-blur lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-[#DCEAF5] px-5 py-5">
            <AppLogo imageSize={48} />
          </div>

          <div className="px-5 py-5">
            <div className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm text-blue-100">Espace</p>
              <h2 className="text-xl font-extrabold">Super Admin</h2>
              <p className="mt-2 text-sm leading-6 text-blue-50">
                Gestion globale de la plateforme Mpangi-church.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

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
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-[#F5F9FC] text-slate-500 group-hover:bg-white group-hover:text-[#03357A]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#03357A]">AKSANTIC</p>
                  <p className="text-xs text-slate-500">
                    Technology Platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="border-b border-[#DCEAF5] bg-white px-6 py-4">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div>
      <h1 className="text-2xl font-extrabold text-[#03357A]">
        Super Admin <span className="text-[#8B5CF6]">Mpangi-church</span>
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Vue globale des églises et de la plateforme.
      </p>
    </div>

    <HeaderActions />
  </div>
</header>

        <main className="px-4 py-5 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}