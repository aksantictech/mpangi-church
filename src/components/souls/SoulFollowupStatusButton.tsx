"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, HeartHandshake, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FollowupStatus =
  | "nouveau"
  | "en_cours"
  | "a_recontacter"
  | "integre"
  | "cloture";

type SoulFollowupStatusButtonProps = {
  followupId: string;
  nextStatus: FollowupStatus;
  label: string;
  variant: "start" | "recall" | "integrated" | "close" | "reopen";
};

const variantClasses = {
  start: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  recall: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  integrated: "bg-green-50 text-green-700 hover:bg-green-100",
  close: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  reopen: "bg-[#F1E8FF] text-[#8B5CF6] hover:bg-purple-100",
};

const variantIcons = {
  start: HeartHandshake,
  recall: Clock3,
  integrated: CheckCircle2,
  close: CheckCircle2,
  reopen: RotateCcw,
};

export default function SoulFollowupStatusButton({
  followupId,
  nextStatus,
  label,
  variant,
}: SoulFollowupStatusButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(`Confirmer le statut : ${label} ?`);

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("soul_followups")
      .update({
        status: nextStatus,
        last_contact_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", followupId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  const Icon = variantIcons[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${variantClasses[variant]}`}
    >
      <Icon className="h-4 w-4" />
      {isLoading ? "..." : label}
    </button>
  );
}