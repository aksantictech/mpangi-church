"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, ShieldCheck } from "lucide-react";

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/super-admin")) return "Super admin";
  if (pathname.startsWith("/administration")) return "Administration";
  if (pathname.startsWith("/finance")) return "Finances";
  if (pathname.startsWith("/patrimony")) return "Patrimoine";
  if (pathname.startsWith("/members")) return "Membres";
  if (pathname.startsWith("/attendance")) return "Présences";
  if (pathname.startsWith("/settings")) return "Paramètres";
  return "Mpangi-church";
}

export default function MobileTopBar() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[#DCEAF5] bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#03357A] text-sm font-black text-white shadow-sm">
            MC
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-[#03357A]">
              {title}
            </span>
            <span className="block truncate text-xs font-semibold text-slate-500">
              Gestion par volets
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <Link
            href="/mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#03357A] text-white"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#F8FBFD] px-3 py-2 text-xs font-bold text-slate-600">
        <ShieldCheck className="h-4 w-4 text-[#03357A]" />
        Accès sécurisé selon vos permissions.
      </div>
    </header>
  );
}
