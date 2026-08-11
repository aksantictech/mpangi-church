"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  HeartHandshake,
  Home,
  Menu,
  Users,
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
};

function subscribeTenantMode() {
  return () => {};
}

function getTenantModeSnapshot() {
  if (typeof window === "undefined") {
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
}: PublicMobileBottomNavProps) {
  const pathname = usePathname() || "/";

  const tenantMode = useSyncExternalStore(
    subscribeTenantMode,
    getTenantModeSnapshot,
    getTenantModeServerSnapshot
  );

  const href = useMemo(
    () => (path: string) =>
      tenantMode
        ? path
        : buildChurchPublicUrl(
            { slug },
            path
          ),
    [slug, tenantMode]
  );

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

  function isActive(value: string) {
    const itemPath = cleanPath(value);

    return (
      pathname === itemPath ||
      (itemPath !== "/" &&
        pathname.startsWith(
          `${itemPath}/`
        ))
    );
  }

  const items = [
    {
      label: "Accueil",
      href: href("/"),
      icon: Home,
    },
    {
      label: "Membres",
      href: href("/join"),
      icon: Users,
    },
    {
      label: "Dons",
      href: href("/don"),
      icon: Gift,
    },
  ];

  return (
    <nav
      data-mpangi-public-bottom-nav
      aria-label="Navigation publique mobile"
      className="
        fixed inset-x-0 bottom-0 z-[90]
        px-3
        pb-[max(env(safe-area-inset-bottom),0.65rem)]
        lg:hidden
      "
    >
      <div
        className="
          mx-auto flex max-w-md items-end gap-1.5
          rounded-[1.75rem]
          border border-slate-200/80
          bg-white/95
          p-2
          shadow-[0_-8px_35px_rgba(15,23,42,0.18)]
          backdrop-blur-xl
        "
      >
        <NavItem
          label="Accueil"
          href={items[0].href}
          icon={Home}
          active={isActive(
            items[0].href
          )}
        />

        <NavItem
          label="Membres"
          href={items[1].href}
          icon={Users}
          active={isActive(
            items[1].href
          )}
        />

        <Link
          href={href("/prayer")}
          aria-label="Demander une prière"
          className="
            group relative -mt-8
            flex min-w-0 flex-1
            flex-col items-center
            justify-end
          "
        >
          <span
            className="
              flex h-[3.9rem] w-[3.9rem]
              items-center justify-center
              rounded-full
              border-[5px] border-white
              bg-[#2563EB]
              text-white
              shadow-xl
              transition-transform
              group-active:scale-95
            "
          >
            <HeartHandshake className="h-6 w-6" />
          </span>

          <span
            className="
              mt-1 text-[10px]
              font-black
              text-[#03357A]
            "
          >
            Prière
          </span>
        </Link>

        <NavItem
          label="Dons"
          href={items[2].href}
          icon={Gift}
          active={isActive(
            items[2].href
          )}
        />

        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent(
                "mpangi:open-public-mobile-menu"
              )
            )
          }
          className="
            flex min-h-14 min-w-0 flex-1
            flex-col items-center justify-center
            gap-1 rounded-2xl px-1
            text-center text-[10px]
            font-black text-slate-500
            transition-all
            hover:bg-slate-50
          "
        >
          <Menu className="h-5 w-5" />
          <span className="truncate">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}

function NavItem({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={
        active ? "page" : undefined
      }
      className={[
        "flex min-h-14 min-w-0 flex-1",
        "flex-col items-center justify-center",
        "gap-1 rounded-2xl px-1",
        "text-center text-[10px] font-black",
        "transition-all",
        active
          ? "bg-[#EAF3FA] text-[#03357A]"
          : "text-slate-500 hover:bg-slate-50",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">
        {label}
      </span>
    </Link>
  );
}