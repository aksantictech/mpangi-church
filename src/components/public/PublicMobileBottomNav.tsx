"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Gift,
  HeartHandshake,
  Home,
  Radio,
} from "lucide-react";
import {
  useMemo,
  useSyncExternalStore,
} from "react";

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
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  return Boolean(
    getTenantSubdomainFromHost(
      window.location.hostname
    )
  );
}

function getTenantModeServerSnapshot() {
  return false;
}

export default function PublicMobileBottomNav({
  slug,
  hasLive = false,
}: PublicMobileBottomNavProps) {
  const pathname =
    usePathname() || "/";

  const tenantMode =
    useSyncExternalStore(
      subscribeTenantMode,
      getTenantModeSnapshot,
      getTenantModeServerSnapshot
    );

  const items = useMemo(() => {
    function href(path: string) {
      return tenantMode
        ? path
        : buildChurchPublicUrl(
            { slug },
            path
          );
    }

    const standardItems = [
      {
        label: "Accueil",
        href: href("/"),
        icon: Home,
        isLive: false,
      },
      {
        label: "Prière",
        href: href("/prayer"),
        icon: HeartHandshake,
        isLive: false,
      },
      {
        label: "Bible",
        href: href("/bible"),
        icon: BookOpen,
        isLive: false,
      },
      {
        label: "Don",
        href: href("/don"),
        icon: Gift,
        isLive: false,
      },
    ];

    if (hasLive) {
      return [
        ...standardItems,
        {
          label: "Direct",
          href: href("/live"),
          icon: Radio,
          isLive: true,
        },
      ];
    }

    return [
      ...standardItems,
      {
        label: "Notif",
        href: href(
          "/public-notifications"
        ),
        icon: Bell,
        isLive: false,
      },
    ];
  }, [
    hasLive,
    slug,
    tenantMode,
  ]);

  function cleanPath(
    value: string
  ) {
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
    <div
      data-mpangi-public-bottom-nav
      role="navigation"
      aria-label="Navigation publique mobile"
      className="fixed inset-x-0 bottom-0 z-[85] grid grid-cols-5 gap-1 border-t border-[#DCEAF5] bg-white/95 px-1 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
      style={{
        gridTemplateColumns:
          "repeat(5, minmax(0, 1fr))",
        paddingBottom:
          "max(env(safe-area-inset-bottom), 0.45rem)",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;

        const itemPath =
          cleanPath(item.href);

        const active =
          pathname === itemPath ||
          (
            itemPath !== "/" &&
            pathname.startsWith(
              `${itemPath}/`
            )
          );

        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            aria-current={
              active
                ? "page"
                : undefined
            }
            aria-label={
              item.isLive
                ? "Regarder le culte en direct"
                : item.label
            }
            className={[
              "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[10px] font-black leading-tight transition",
              item.isLive
                ? "bg-red-600 text-white shadow-lg shadow-red-900/25 hover:bg-red-700"
                : active
                  ? "bg-[#EAF3FA] text-[#03357A]"
                  : "text-slate-500",
            ].join(" ")}
          >
            {item.isLive && (
              <span className="absolute right-2 top-1.5 h-2.5 w-2.5 animate-ping rounded-full bg-white/80" />
            )}

            <Icon
              className={[
                "h-5 w-5 shrink-0",
                item.isLive
                  ? "animate-pulse"
                  : "",
              ].join(" ")}
            />

            <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}