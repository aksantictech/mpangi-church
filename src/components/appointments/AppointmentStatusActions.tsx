"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Archive, CircleDot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AppointmentStatusActionsProps = {
  appointmentId: string;
  currentStatus?: string | null;
};

const statuses = [
  {
    value: "nouvelle",
    label: "Nouvelle",
    icon: CircleDot,
    className: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    value: "en_cours",
    label: "En cours",
    icon: Clock,
    className: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    value: "traitee",
    label: "Traitée",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    value: "archivee",
    label: "Archivée",
    icon: Archive,
    className: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  },
];

export default function AppointmentStatusActions({
  appointmentId,
  currentStatus,
}: AppointmentStatusActionsProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);
  const normalizedCurrentStatus = currentStatus || "nouvelle";

  async function updateStatus(status: string) {
    if (status === normalizedCurrentStatus) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("appointments")
      .update({
        status,
      })
      .eq("id", appointmentId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const Icon = status.icon;
        const active = normalizedCurrentStatus === status.value;

        return (
          <button
            key={status.value}
            type="button"
            onClick={() => updateStatus(status.value)}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold transition disabled:opacity-60 ${
              active
                ? "bg-[#03357A] text-white"
                : status.className
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}

            {status.label}
          </button>
        );
      })}
    </div>
  );
}