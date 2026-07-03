"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChurchStatusActionButtonProps = {
  churchId: string;
  currentStatus: string;
  action: "disable" | "activate" | "archive";
};

export default function ChurchStatusActionButton({
  churchId,
  currentStatus,
  action,
}: ChurchStatusActionButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  const config = {
    disable: {
      label: "Désactiver",
      nextStatus: "inactive",
      icon: Ban,
      className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      confirmMessage: "Voulez-vous vraiment désactiver cette église ?",
    },
    activate: {
      label: "Réactiver",
      nextStatus: "active",
      icon: RotateCcw,
      className:
        "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      confirmMessage: "Voulez-vous réactiver cette église ?",
    },
    archive: {
      label: "Archiver",
      nextStatus: "archived",
      icon: Archive,
      className:
        "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
      confirmMessage:
        "Voulez-vous vraiment archiver cette église ? Elle ne sera plus visible comme église active.",
    },
  }[action];

  async function handleClick() {
    if (currentStatus === config.nextStatus) return;

    const confirmed = window.confirm(config.confirmMessage);

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("churches")
      .update({ status: config.nextStatus })
      .eq("id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold disabled:opacity-60 ${config.className}`}
    >
      <Icon className="h-4 w-4" />
      {isLoading ? "..." : config.label}
    </button>
  );
}