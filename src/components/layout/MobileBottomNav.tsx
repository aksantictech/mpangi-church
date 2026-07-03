"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  HeartHandshake,
  Home,
  Menu,
  Users,
} from "lucide-react";

const items = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
    match: ["/dashboard"],
  },
  {
    label: "Membres",
    href: "/members",
    icon: Users,
    match: ["/members"],
  },
  {
    label: "Présences",
    href: "/attendance",
    icon: CalendarCheck,
    match: ["/attendance"],
  },
  {
    label: "Âmes",
    href: "/souls",
    icon: HeartHandshake,
    match: ["/souls"],
  },
  {
    label: "Menu",
    href: "/mobile-menu",
    icon: Menu,
    match: [
      "/mobile-menu",
      "/departments",
      "/events",
      "/public-requests",
      "/appointments",
      "/testimonies",
      "/settings",
      "/account",
      "/install",
    ],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCEAF5] bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match.some((path) => pathname.startsWith(path));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold transition ${
                active
                  ? "bg-gradient-to-br from-[#03357A] to-[#2563EB] text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-500 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              }`}
            >
              <Icon className="mb-1 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}