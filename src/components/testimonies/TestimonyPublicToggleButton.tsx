"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TestimonyPublicToggleButtonProps = {
  testimonyId: string;
  isPublic: boolean;
  profileId: string;
};

export default function TestimonyPublicToggleButton({
  testimonyId,
  isPublic,
  profileId,
}: TestimonyPublicToggleButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);

    const nextValue = !isPublic;

    const { error } = await supabase
      .from("testimonies")
      .update({
        is_public: nextValue,
        published_at: nextValue ? new Date().toISOString() : null,
        published_by: nextValue ? profileId : null,
      })
      .eq("id", testimonyId);

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
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold shadow-sm transition disabled:opacity-60 ${
        isPublic
          ? "bg-red-50 text-red-700 hover:bg-red-100"
          : "bg-[#03357A] text-white hover:bg-[#022B63]"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublic ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}

      {isLoading
        ? "Traitement..."
        : isPublic
          ? "Retirer du public"
          : "Publier"}
    </button>
  );
}