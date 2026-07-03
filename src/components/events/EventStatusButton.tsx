"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, PlayCircle, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EventStatus = "planifie" | "en_cours" | "termine" | "annule";

type EventStatusButtonProps = {
  eventId: string;
  nextStatus: EventStatus;
  label: string;
  confirmMessage: string;
  variant: "start" | "finish" | "cancel" | "reactivate";
};

const variantClasses = {
  start: "bg-green-50 text-green-700 hover:bg-green-100",
  finish: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  cancel: "bg-red-50 text-red-700 hover:bg-red-100",
  reactivate: "bg-orange-50 text-orange-700 hover:bg-orange-100",
};

const variantIcons = {
  start: PlayCircle,
  finish: CheckCircle2,
  cancel: Ban,
  reactivate: RotateCcw,
};

export default function EventStatusButton({
  eventId,
  nextStatus,
  label,
  confirmMessage,
  variant,
}: EventStatusButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("events")
      .update({ status: nextStatus })
      .eq("id", eventId);

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