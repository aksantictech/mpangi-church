"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  Eye,
  Loader2,
  MoreVertical,
  Power,
  RotateCcw,
  Trash2,
} from "lucide-react";

type MemberRowActionsProps = {
  memberId: string;
  memberName: string;
  status?: string | null;
  archivedAt?: string | null;
};

export default function MemberRowActions({
  memberId,
  memberName,
  status,
  archivedAt,
}: MemberRowActionsProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isInactive = status === "inactif";
  const isArchived = Boolean(archivedAt);

  async function runAction(
    action: "activate" | "deactivate" | "archive" | "delete"
  ) {
    let confirmed = true;

    if (action === "deactivate") {
      confirmed = window.confirm(
        `Désactiver ${memberName} ? Son QR Code ne sera plus utilisable pour les présences.`
      );
    }

    if (action === "archive") {
      confirmed = window.confirm(
        `Archiver ${memberName} ? Il ne sera plus affiché dans la liste active.`
      );
    }

    if (action === "delete") {
      confirmed = window.confirm(
        `Supprimer définitivement ${memberName} ? Cette action est irréversible.`
      );
    }

    if (!confirmed) return;

    setIsLoading(true);

    const response = await fetch("/api/members/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberId,
        action,
      }),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(payload.error || "Erreur pendant l’action.");
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="relative flex items-center gap-2">
      <Link
        href={`/members/${memberId}`}
        className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#DCEAF5]"
      >
        <Eye className="h-4 w-4" />
        Voir
      </Link>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#03357A] ring-1 ring-[#DCEAF5] hover:bg-[#F8FBFD]"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white p-2 shadow-xl">
          {isInactive || isArchived ? (
            <button
              type="button"
              onClick={() => runAction("activate")}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-60"
            >
              <RotateCcw className="h-5 w-5" />
              Réactiver le membre
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runAction("deactivate")}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
            >
              <Power className="h-5 w-5" />
              Désactiver
            </button>
          )}

          {!isArchived && (
            <button
              type="button"
              onClick={() => runAction("archive")}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Archive className="h-5 w-5" />
              Archiver
            </button>
          )}

          <button
            type="button"
            onClick={() => runAction("delete")}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-5 w-5" />
            Supprimer définitivement
          </button>
        </div>
      )}
    </div>
  );
}