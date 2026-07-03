"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RequestType = "prayer" | "appointment" | "join" | "testimony";

type PublicRequestStatusActionsProps = {
  requestId: string;
  requestType: RequestType;
  currentStatus: string | null;
};

const tableByType: Record<RequestType, string> = {
  prayer: "prayer_requests",
  appointment: "appointments",
  join: "join_requests",
  testimony: "testimonies",
};

export default function PublicRequestStatusActions({
  requestId,
  requestType,
  currentStatus,
}: PublicRequestStatusActionsProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  async function updateStatus(nextStatus: string) {
    if (currentStatus === nextStatus) return;

    if (nextStatus === "archivee") {
      const confirmed = window.confirm(
        "Voulez-vous vraiment archiver cette demande ?"
      );

      if (!confirmed) return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from(tableByType[requestType])
      .update({ status: nextStatus })
      .eq("id", requestId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Mise à jour...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "nouvelle" && (
        <button
          type="button"
          onClick={() => updateStatus("en_cours")}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          <PlayCircle className="h-4 w-4" />
          Prendre en charge
        </button>
      )}

      {currentStatus !== "traitee" && currentStatus !== "archivee" && (
        <button
          type="button"
          onClick={() => updateStatus("traitee")}
          className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marquer traitée
        </button>
      )}

      {currentStatus !== "archivee" && (
        <button
          type="button"
          onClick={() => updateStatus("archivee")}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          <Archive className="h-4 w-4" />
          Archiver
        </button>
      )}
    </div>
  );
}