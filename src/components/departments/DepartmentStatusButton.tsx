"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DepartmentStatusButtonProps = {
  departmentId: string;
  currentStatus: string;
};

export default function DepartmentStatusButton({
  departmentId,
  currentStatus,
}: DepartmentStatusButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);

  const isActive = currentStatus === "active";
  const nextStatus = isActive ? "inactive" : "active";

  async function handleClick() {
    const confirmed = window.confirm(
      isActive
        ? "Voulez-vous vraiment désactiver ce département ?"
        : "Voulez-vous réactiver ce département ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("departments")
      .update({ status: nextStatus })
      .eq("id", departmentId);

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
        isActive
          ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
          : "bg-green-50 text-green-600 hover:bg-green-100"
      }`}
    >
      {isActive ? (
        <Power className="h-4 w-4" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}

      {isLoading ? "..." : isActive ? "Désactiver" : "Réactiver"}
    </button>
  );
}