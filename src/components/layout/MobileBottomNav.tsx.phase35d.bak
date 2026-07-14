"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Home,
  QrCode,
  Settings,
} from "lucide-react";

const ITEMS = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
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
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCEAF5] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-black transition",
                active
                  ? "bg-[#03357A] text-white"
                  : "text-slate-500 hover:bg-[#EAF3FA] hover:text-[#03357A]",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
