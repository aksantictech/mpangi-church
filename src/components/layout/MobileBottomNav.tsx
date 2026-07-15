"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Grid3X3,
  Home,
  MoreHorizontal,
  QrCode,
} from "lucide-react";

const ITEMS = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Modules",
    href: "/modules",
    icon: Grid3X3,
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
];

function isActive(
  pathname: string,
  href: string
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

export default function MobileBottomNav() {
  const pathname =
    usePathname();

  return (
    <div
      data-mpangi-church-mobile-nav
      role="navigation"
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-5 gap-1 border-t border-[#DCEAF5] bg-white/95 px-1.5 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
      style={{
        gridTemplateColumns:
          "repeat(5, minmax(0, 1fr))",
        paddingBottom:
          "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          isActive(
            pathname,
            item.href
          );

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
              "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[10px] font-black leading-tight transition",
              active
                ? "bg-[#03357A] text-white"
                : "text-slate-500",
            ].join(" ")}
          >
            <Icon className="h-5 w-5 shrink-0" />

            <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent(
              "mpangi:open-mobile-menu"
            )
          );
        }}
        className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[10px] font-black leading-tight text-slate-500"
        aria-label="Ouvrir plus de menus"
      >
        <MoreHorizontal className="h-5 w-5 shrink-0" />

        <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          Plus
        </span>
      </button>
    </div>
  );
}
