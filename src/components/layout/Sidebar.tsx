"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Shield, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getGroupedVisibleMenuItems } from "@/lib/modules/moduleRegistry";

type MyModulesResponse = {
  role?: string;
  churchId?: string | null;
  moduleCodes?: string[];
};

const SUPER_ADMIN_ITEMS = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: Shield },
  { label: "Églises", href: "/super-admin/churches", icon: Shield },
  { label: "Utilisateurs", href: "/super-admin/users", icon: UsersRound },
  { label: "Modules", href: "/super-admin/modules", icon: Shield },
  { label: "Paramètres", href: "/super-admin/settings", icon: Shield },
];

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [myModules, setMyModules] = useState<MyModulesResponse>({
    moduleCodes: ["dashboard"],
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/modules/my-modules", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        setMyModules({
          role: payload.role,
          churchId: payload.churchId,
          moduleCodes: payload.moduleCodes || ["dashboard"],
        });
      })
      .catch(() => {
        if (!mounted) return;
        setMyModules({ moduleCodes: ["dashboard"] });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const role = String(myModules.role || "").toLowerCase();
  const isSuperAdmin = pathname.startsWith("/super-admin");

  const groups = useMemo(() => {
    const baseGroups = getGroupedVisibleMenuItems(myModules.moduleCodes || ["dashboard"]);

    if (ADMIN_ROLES.has(role)) {
      return baseGroups.map((group) => {
        if (group.key !== "system") return group;

        const alreadyExists = group.items.some((item) => item.href === "/settings/users");

        if (alreadyExists) return group;

        return {
          ...group,
          items: [
            ...group.items,
            {
              code: "user_permissions",
              label: "Utilisateurs & rôles",
              href: "/settings/users",
              icon: UsersRound,
              category: "system" as const,
            },
          ],
        };
      });
    }

    return baseGroups;
  }, [myModules.moduleCodes, role]);

  useEffect(() => {
    const nextOpenGroups: Record<string, boolean> = {};

    for (const group of groups) {
      nextOpenGroups[group.key] = group.items.some((item) =>
        isActive(pathname, item.href)
      );

      if (group.key === "system") {
        nextOpenGroups[group.key] = true;
      }
    }

    setOpenGroups((previous) => ({ ...nextOpenGroups, ...previous }));
  }, [groups, pathname]);

  if (isSuperAdmin) {
    return (
      <aside className="hidden h-screen w-72 shrink-0 border-r border-[#DCEAF5] bg-white p-4 lg:sticky lg:top-0 lg:block">
        <div className="rounded-3xl bg-[#03357A] p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>
          <h2 className="mt-2 text-xl font-black">Super admin</h2>
        </div>

        <nav className="mt-5 space-y-2">
          {SUPER_ADMIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  active
                    ? "bg-[#03357A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden h-screen w-76 shrink-0 border-r border-[#DCEAF5] bg-white p-4 lg:sticky lg:top-0 lg:block">
      <div className="rounded-3xl bg-[#03357A] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
          Mpangi-church
        </p>
        <h2 className="mt-2 text-xl font-black">Espace église</h2>
        <p className="mt-1 text-xs font-semibold text-blue-100">
          Gestion par volets
        </p>
      </div>

      <nav className="mt-5 space-y-3 pb-8">
        {groups.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups[group.key] ?? group.key === "system";

          return (
            <div key={group.key} className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-2">
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((previous) => ({
                    ...previous,
                    [group.key]: !isOpen,
                  }))
                }
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[#03357A] transition hover:bg-white"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#EAF3FA]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-black">
                      {group.title}
                    </span>
                    <span className="block text-[11px] font-semibold text-slate-500">
                      {group.description}
                    </span>
                  </span>
                </span>

                <ChevronDown
                  className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={`${group.key}-${item.href}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                          active
                            ? "bg-[#03357A] text-white shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-[#03357A]"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
