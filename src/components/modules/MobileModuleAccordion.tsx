"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ModuleMenuGroup } from "@/lib/modules/moduleRegistry";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileModuleAccordion({
  groups,
}: {
  groups: ModuleMenuGroup[];
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    for (const group of groups) {
      initial[group.key] =
        group.key === "system" ||
        group.items.some((item) => isActive(pathname, item.href));
    }

    return initial;
  });

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const Icon = group.icon;
        const isOpen = openGroups[group.key] ?? false;

        return (
          <section
            key={group.key}
            className="rounded-3xl border border-[#DCEAF5] bg-white p-3 shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                setOpenGroups((previous) => ({
                  ...previous,
                  [group.key]: !isOpen,
                }))
              }
              className="flex w-full items-center justify-between rounded-2xl bg-[#F8FBFD] px-4 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black text-[#03357A]">
                    {group.title}
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    {group.description}
                  </span>
                </span>
              </span>

              <ChevronDown
                className={`h-5 w-5 text-[#03357A] transition ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="mt-3 grid gap-2">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={`${group.key}-${item.href}`}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-extrabold transition ${
                        active
                          ? "bg-[#03357A] text-white"
                          : "bg-[#F8FBFD] text-slate-700 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                      }`}
                    >
                      <ItemIcon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
