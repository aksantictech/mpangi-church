"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Menu,
  MessageSquareHeart,
  QrCode,
  Users,
} from "lucide-react";

const navItems = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Membres",
    href: "/members",
    icon: Users,
  },
  {
    label: "Scanner",
    href: "/attendance/scanner",
    icon: QrCode,
  },
  {
    label: "Demandes",
    href: "/public-requests",
    icon: MessageSquareHeart,
  },
  {
    label: "Menu",
    href: "/mobile-menu",
    icon: Menu,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCEAF5] bg-white/95 px-2 pb-3 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-extrabold transition ${
                active
                  ? "bg-[#03357A] text-white shadow-lg shadow-blue-900/20"
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
