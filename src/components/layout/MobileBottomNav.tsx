"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Menu,
  QrCode,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Menu",
    href: "/mobile-menu",
    icon: Menu,
  },
  {
    label: "Scanner",
    href: "/attendance/scanner",
    icon: QrCode,
  },
  {
    label: "Alertes",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Réglages",
    href: "/settings",
    icon: Settings,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 lg:hidden">
      <div className="grid grid-cols-5 gap-1 rounded-[1.7rem] border border-[#DCEAF5] bg-white/95 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-extrabold transition ${
                active
                  ? "bg-[#03357A] text-white"
                  : "text-slate-500 hover:bg-[#EAF3FA] hover:text-[#03357A]"
              }`}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
