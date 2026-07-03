"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

type ConvertSoulToMemberButtonProps = {
  followupId: string;
  memberId?: string | null;
};

export default function ConvertSoulToMemberButton({
  followupId,
  memberId,
}: ConvertSoulToMemberButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConvert() {
    if (memberId) {
      router.push(`/members/${memberId}`);
      return;
    }

    const confirmed = window.confirm(
      "Voulez-vous convertir cette personne en membre de l’église ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const response = await fetch(`/api/souls/${followupId}/convert-to-member`, {
      method: "POST",
    });

    const result = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(result.message || "Erreur lors de la conversion.");
      return;
    }

    if (result.memberId) {
      router.push(`/members/${result.memberId}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleConvert}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}

      {memberId
        ? "Voir le membre"
        : isLoading
          ? "Conversion..."
          : "Convertir en membre"}
    </button>
  );
}