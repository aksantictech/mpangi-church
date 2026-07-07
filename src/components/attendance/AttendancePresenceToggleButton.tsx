"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserX } from "lucide-react";

type AttendancePresenceToggleButtonProps = {
  eventId: string;
  memberId: string;
  isPresent: boolean;
};

export default function AttendancePresenceToggleButton({
  eventId,
  memberId,
  isPresent,
}: AttendancePresenceToggleButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (isPending) return;

    if (isPresent) {
      const confirmed = window.confirm(
        "Voulez-vous vraiment retirer la présence de ce membre pour cet événement ?"
      );

      if (!confirmed) return;
    }

    setIsPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/attendance/event-presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          memberId,
          action: isPresent ? "remove" : "mark_present",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Action impossible.");
        return;
      }

      setMessage(payload.message || "Action enregistrée.");
      router.refresh();
    } catch {
      setMessage("Erreur pendant l’action.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition disabled:opacity-60 ${
          isPresent
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-[#03357A] text-white hover:bg-[#022B63]"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPresent ? (
          <UserX className="h-4 w-4" />
        ) : (
          <UserCheck className="h-4 w-4" />
        )}

        {isPresent ? "Retirer" : "Pointer manuel"}
      </button>

      {message && (
        <p
          className={`max-w-[220px] text-xs font-semibold ${
            message.toLowerCase().includes("erreur") ||
            message.toLowerCase().includes("impossible")
              ? "text-red-600"
              : "text-slate-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
