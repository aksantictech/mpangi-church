"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Gift,
  HeartHandshake,
  Home,
  Radio,
  UserPlus,
} from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import {
  buildChurchPublicUrl,
  getTenantSubdomainFromHost,
} from "@/lib/tenant/domain";

type PublicMobileBottomNavProps = {
  slug: string;
  hasLive?: boolean;
};

function subscribeTenantMode() {
  return () => {};
}

function getTenantModeSnapshot() {
  if (typeof window === "undefined") return false;

  return Boolean(
    getTenantSubdomainFromHost(window.location.hostname)
  );
}

function getTenantModeServerSnapshot() {
  return false;
}

export default function PublicMobileBottomNav({
  slug,
  hasLive = false,
}: PublicMobileBottomNavProps) {
  const pathname = usePathname() || "/";

  const tenantMode = useSyncExternalStore(
    subscribeTenantMode,
    getTenantModeSnapshot,
    getTenantModeServerSnapshot
  );

  const items = useMemo(() => {
    const href = (path: string) =>
      tenantMode
        ? path
        : buildChurchPublicUrl({ slug }, path);

    return [
      {
        label: "Accueil",
        href: href("/"),
        icon: Home,
      },
      {
        label: "Prière",
        href: href("/prayer"),
        icon: HeartHandshake,
      },
      {
        label: "Bible",
        href: href("/bible"),
        icon: BookOpen,
      },
      {
        label: "Don",
        href: href("/don"),
        icon: Gift,
      },
      hasLive
        ? {
            label: "Direct",
            href: href("/live"),
            icon: Radio,
            live: true,
          }
        : {
            label: "Rejoindre",
            href: href("/join"),
            icon: UserPlus,
          },
    ];
  }, [hasLive, slug, tenantMode]);

  function cleanPath(value: string) {
    try {
      return new URL(
        value,
        "https://local.invalid"
      ).pathname;
    } catch {
      return value;
    }
  }

  return (
    <nav
      data-mpangi-public-bottom-nav
      role="navigation"
      aria-label="Navigation publique mobile"
      className="fixed inset-x-0 bottom-0 z-[85] px-3 pb-[max(env(safe-area-inset-bottom),0.65rem)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end gap-1.5 rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-2 shadow-[0_-8px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const itemPath = cleanPath(item.href);

          const active =
            pathname === itemPath ||
            (
              itemPath !== "/" &&
              pathname.startsWith(`${itemPath}/`)
            );

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              aria-current={
                active ? "page" : undefined
              }
              aria-label={
                item.live
                  ? "Regarder le culte en direct"
                  : item.label
              }
              className={[
                "relative flex min-h-14 min-w-0 flex-1",
                "flex-col items-center justify-center",
                "gap-1 rounded-2xl px-1",
                "text-center text-[10px] font-black",
                "transition-all",
                item.live
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/25"
                  : active
                    ? "bg-[#EAF3FA] text-[#03357A]"
                    : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              {item.live && (
                <span className="absolute right-2 top-1.5 h-2.5 w-2.5 animate-ping rounded-full bg-white/80" />
              )}

              <Icon
                className={[
                  "h-5 w-5",
                  item.live ? "animate-pulse" : "",
                ].join(" ")}
              />

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}