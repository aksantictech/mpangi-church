"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  isActiveMenuItem,
  type ModuleMenuGroup,
} from "@/lib/modules/moduleRegistry";

export default function MobileModuleAccordion({
  groups,
}: {
  groups: ModuleMenuGroup[];
}) {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string>(() => {
    const activeGroup = groups.find((group) =>
      group.items.some((item) => isActiveMenuItem(pathname, item.href))
    );

    return activeGroup?.key || "system";
  });

  return (
    <div className="space-y-3 pb-24">
      {groups.map((group) => {
        const Icon = group.icon;
        const isOpen = openKey === group.key;
        const hasActiveItem = group.items.some((item) =>
          isActiveMenuItem(pathname, item.href)
        );

        return (
          <section
            key={group.key}
            className="overflow-hidden rounded-[1.5rem] border border-[#DCEAF5] bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? "" : group.key)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left ${
                hasActiveItem || isOpen ? "bg-[#EAF3FA]" : "bg-white"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-base font-black text-[#03357A]">
                    {group.title}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    {group.description}
                  </span>
                </span>
              </span>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[#03357A] transition ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="grid gap-2 border-t border-[#DCEAF5] bg-[#F8FBFD] p-3">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isActiveMenuItem(pathname, item.href);

                  return (
                    <Link
                      key={`${group.key}-${item.href}`}
                      href={item.href}
                      className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                        active
                          ? "bg-[#03357A] text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-[#EAF3FA] hover:text-[#03357A]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          active ? "bg-white/15" : "bg-[#EAF3FA]"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
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
