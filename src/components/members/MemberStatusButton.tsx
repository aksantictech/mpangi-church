"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemberStatusButtonProps = {
  memberId: string;
  currentStatus: string;
};

export default function MemberStatusButton({
  memberId,
  currentStatus,
}: MemberStatusButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);

  const isInactive = currentStatus === "inactif";
  const nextStatus = isInactive ? "actif" : "inactif";

  async function handleClick() {
    const confirmed = window.confirm(
      isInactive
        ? "Voulez-vous réactiver ce membre ?"
        : "Voulez-vous désactiver ce membre ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("members")
      .update({ status: nextStatus })
      .eq("id", memberId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
        isInactive
          ? "bg-green-50 text-green-600 hover:bg-green-100"
          : "bg-orange-50 text-orange-600 hover:bg-orange-100"
      }`}
    >
      {isInactive ? (
        <RotateCcw className="h-4 w-4" />
      ) : (
        <Power className="h-4 w-4" />
      )}

      {isLoading ? "..." : isInactive ? "Réactiver" : "Désactiver"}
    </button>
  );
}