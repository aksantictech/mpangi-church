"use client";

import { useState } from "react";
import { BellRing, Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type PublicationActionsProps = {
  publicationId: string;
  isPublished: boolean;
  isFeatured: boolean;
};

export default function PublicationActions({
  publicationId,
  isPublished,
  isFeatured,
}: PublicationActionsProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  async function runAction(
    action: "publish" | "unpublish" | "feature" | "unfeature" | "notify" | "delete"
  ) {
    if (action === "delete") {
      const confirmed = window.confirm("Supprimer cette publication ?");
      if (!confirmed) return;
    }

    setIsLoading(true);

    const response = await fetch("/api/publications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicationId,
        action,
      }),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(payload.error || "Erreur pendant l’action.");
      return;
    }

    if (action === "notify") {
      alert(
        payload.warning ||
          `Notifications envoyées : ${payload.sentCount || 0}.`
      );
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => runAction(isPublished ? "unpublish" : "publish")}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A] disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}

        {isPublished ? "Masquer" : "Publier"}
      </button>

      <button
        type="button"
        onClick={() => runAction(isFeatured ? "unfeature" : "feature")}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-50 px-3 py-2 text-xs font-extrabold text-yellow-700 disabled:opacity-60"
      >
        <Star className="h-4 w-4" />
        {isFeatured ? "Retirer vedette" : "Vedette"}
      </button>

      <button
        type="button"
        onClick={() => runAction("notify")}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700 disabled:opacity-60"
      >
        <BellRing className="h-4 w-4" />
        Notifier
      </button>

      <button
        type="button"
        onClick={() => runAction("delete")}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </button>
    </div>
  );
}