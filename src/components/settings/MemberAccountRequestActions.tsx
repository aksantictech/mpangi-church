"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MemberAccountRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function decide(decision: "approved" | "rejected" | "needs_information") {
    const reason =
      decision === "approved"
        ? ""
        : window.prompt(decision === "rejected" ? "Motif du refus :" : "Information demandée au membre :") || "";
    if (decision !== "approved" && !reason.trim()) return;
    setLoading(decision);
    const response = await fetch(`/api/settings/member-account-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    const payload = await response.json();
    setLoading("");
    if (!response.ok) {
      window.alert(payload.error || "Action impossible.");
      return;
    }
    window.alert(payload.message);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => decide("approved")} disabled={Boolean(loading)} className="min-h-10 rounded-xl bg-green-600 px-3 text-xs font-black text-white">Approuver</button>
      <button onClick={() => decide("needs_information")} disabled={Boolean(loading)} className="min-h-10 rounded-xl bg-amber-50 px-3 text-xs font-black text-amber-700">Précisions</button>
      <button onClick={() => decide("rejected")} disabled={Boolean(loading)} className="min-h-10 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700">Refuser</button>
    </div>
  );
}

