"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Church,
  ClipboardCheck,
  Download,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  PackageCheck,
  PieChart,
  QrCode,
  ReceiptText,
  ScanLine,
  ScrollText,
  Settings,
  TestTube2,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  ModuleCategory,
  ModuleMenuGroup,
} from "@/lib/modules/moduleRegistry";

const ICONS: Record<string, LucideIcon> = {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarCheck,
  CalendarDays,
  Church,
  ClipboardCheck,
  Download,
  FileText,
  Globe,
  HandCoins,
  HeartHandshake,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  PackageCheck,
  PieChart,
  QrCode,
  ReceiptText,
  ScanLine,
  ScrollText,
  Settings,
  TestTube2,
  Users,
  Wallet,
  Warehouse,
  Wrench,
};

const GROUP_ICONS: Record<ModuleCategory, LucideIcon> = {
  system: Settings,
  spiritual: HeartHandshake,
  administration: Inbox,
  finance: Wallet,
  patrimony: Warehouse,
};

type MobileModuleAccordionProps = {
  groups: ModuleMenuGroup[];
};

export default function MobileModuleAccordion({
  groups,
}: MobileModuleAccordionProps) {
  const defaultOpenGroups = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const group of groups) {
      open[group.category] = group.category === "system";
    }
    return open;
  }, [groups]);

  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>(defaultOpenGroups);

  function toggleGroup(category: string) {
    setOpenGroups((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <section className="space-y-4">
      {groups.map((group) => {
        const GroupIcon = GROUP_ICONS[group.category] || LayoutGrid;
        const isOpen = Boolean(openGroups[group.category]);

        return (
          <div
            key={group.category}
            className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.category)}
              className="flex w-full items-center gap-4 bg-[#F8FBFD] p-4 text-left"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <GroupIcon className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold text-[#03357A]">
                  {group.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {group.description}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  {group.items.length} module(s)
                </p>
              </div>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                  isOpen ? "rotate-180 text-[#03357A]" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="grid gap-3 p-4">
                {group.items.map((item) => {
                  const Icon = ICONS[item.iconKey] || Home;

                  return (
                    <Link
                      key={`${item.code}-${item.href}`}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[#03357A]">
                          {item.title}
                        </p>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03357A]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
