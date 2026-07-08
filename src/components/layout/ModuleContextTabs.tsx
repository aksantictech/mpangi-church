"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  findActiveMenuGroup,
  getGroupedVisibleMenuItems,
  isActiveMenuItem,
} from "@/lib/modules/moduleRegistry";

type MyModulesResponse = {
  role?: string;
  moduleCodes?: string[];
};

export default function ModuleContextTabs() {
  const pathname = usePathname();
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

  const groups = useMemo(() => {
    return getGroupedVisibleMenuItems(myModules.moduleCodes || ["dashboard"]);
  }, [myModules.moduleCodes]);

  const activeGroup = findActiveMenuGroup(groups, pathname);

  if (!activeGroup || activeGroup.key === "system" || activeGroup.items.length <= 1) {
    return null;
  }

  const ActiveGroupIcon = activeGroup.icon;

  return (
    <div className="sticky top-0 z-30 -mx-3 mb-5 border-b border-[#DCEAF5] bg-[#F5F9FC]/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5 lg:top-0 lg:-mx-6 lg:px-6 xl:-mx-8 xl:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto">
        <div className="hidden shrink-0 items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-[#03357A] shadow-sm md:flex">
          <ActiveGroupIcon className="h-4 w-4" />
          {activeGroup.shortTitle}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {activeGroup.items.map((item) => {
            const Icon = item.icon;
            const active = isActiveMenuItem(pathname, item.href);

            return (
              <Link
                key={`${activeGroup.key}-tabs-${item.href}`}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${
                  active
                    ? "bg-[#03357A] text-white shadow-sm"
                    : "bg-white text-slate-600 shadow-sm hover:bg-[#EAF3FA] hover:text-[#03357A]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
