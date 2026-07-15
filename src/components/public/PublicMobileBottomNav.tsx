"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Gift,
  HeartHandshake,
  Home,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildChurchPublicUrl,
  getTenantSubdomainFromHost,
} from "@/lib/tenant/domain";

export default function PublicMobileBottomNav({
  slug,
}: {
  slug: string;
}) {
  const pathname =
    usePathname();

  const [
    tenantMode,
    setTenantMode,
  ] = useState(false);

  useEffect(() => {
    setTenantMode(
      Boolean(
        getTenantSubdomainFromHost(
          window.location.hostname
        )
      )
    );
  }, []);

  const items = useMemo(() => {
    function href(path: string) {
      return tenantMode
        ? path
        : buildChurchPublicUrl(
            { slug },
            path
          );
    }

    return [
      {
        label: "Accueil",
        href: href("/"),
        icon: Home,
      },
      {
        label: "Prière",
        href: href("/prayer"),
        icon:
          HeartHandshake,
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
      {
        label: "Notif",
        href: href(
          "/public-notifications"
        ),
        icon: Bell,
      },
    ];
  }, [slug, tenantMode]);

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
            className={[
              "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[10px] font-black leading-tight",
              active
                ? "bg-[#EAF3FA] text-[#03357A]"
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
    </div>
  );
}
