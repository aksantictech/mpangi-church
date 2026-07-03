"use client";

import { Bell } from "lucide-react";
import AccountMenu from "@/components/account/AccountMenu";

export default function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5] transition hover:bg-[#EAF3FA]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8B5CF6] px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
          5
        </span>
      </button>

      <AccountMenu />
    </div>
  );
}