"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Church,
  HeartHandshake,
  Home,
  MessageSquareText,
  Settings,
  TestTube2,
  Users,
  Building2,
} from "lucide-react";
import AppLogo from "@/components/brand/AppLogo";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Membres", href: "/members", icon: Users },
  { label: "Présences", href: "/attendance", icon: CalendarCheck },
  { label: "Suivi des âmes", href: "/souls", icon: HeartHandshake },
  { label: "Départements", href: "/departments", icon: Building2 },
  { label: "Événements", href: "/events", icon: CalendarDays },
  { label: "Demandes publiques", href: "/public-requests", icon: MessageSquareText },
  { label: "Rendez-vous", href: "/appointments", icon: Church },
  { label: "Témoignages", href: "/testimonies", icon: TestTube2 },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[#DCEAF5] bg-white/95 shadow-sm backdrop-blur lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-[#DCEAF5] px-5 py-5">
          <AppLogo imageSize={48} />
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
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
      </div>
    </aside>
  );
}