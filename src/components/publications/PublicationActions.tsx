"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  BellRing,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

type PublicationAction =
  | "publish"
  | "unpublish"
  | "feature"
  | "unfeature"
  | "notify"
  | "archive"
  | "restore"
  | "delete";

type PublicationActionsProps = {
  publicationId: string;
  isPublished: boolean;
  isFeatured: boolean;
  isArchived: boolean;
};

type ActionResponse = {
  error?: string;
  warning?: string;
  sentCount?: number;
};

export default function PublicationActions({
  publicationId,
  isPublished,
  isFeatured,
  isArchived,
}: PublicationActionsProps) {
  const router = useRouter();

  const [activeAction, setActiveAction] =
    useState<PublicationAction | null>(null);

  const isLoading = activeAction !== null;

  async function runAction(
    action: PublicationAction
  ) {
    if (action === "delete") {
      const confirmed = window.confirm(
        "Supprimer définitivement cette publication ? Cette opération est irréversible."
      );

      if (!confirmed) return;
    }

    if (action === "archive") {
      const confirmed = window.confirm(
        "Archiver cette publication ? Elle ne sera plus visible publiquement."
      );

      if (!confirmed) return;
    }

    setActiveAction(action);

    try {
      const response = await fetch(
        "/api/publications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            publicationId,
            action,
          }),
        }
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as ActionResponse;

      if (!response.ok) {
        window.alert(
          payload.error ||
            "Erreur pendant l’action."
        );

        return;
      }

      if (action === "notify") {
        window.alert(
          payload.warning ||
            `Notifications envoyées : ${
              payload.sentCount || 0
            }.`
        );
      }

      router.refresh();
    } catch {
      window.alert(
        "Impossible de contacter le serveur."
      );
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/publications/${publicationId}/edit`}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 hover:bg-violet-100"
      >
        <Pencil className="h-4 w-4" />
        Modifier
      </Link>

      {isArchived ? (
        <button
          type="button"
          onClick={() =>
            runAction("restore")
          }
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 disabled:opacity-60"
        >
          {activeAction === "restore" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArchiveRestore className="h-4 w-4" />
          )}

          Restaurer
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() =>
              runAction(
                isPublished
                  ? "unpublish"
                  : "publish"
              )
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A] disabled:opacity-60"
          >
            {activeAction === "publish" ||
            activeAction === "unpublish" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}

            {isPublished
              ? "Masquer"
              : "Publier"}
          </button>

          <button
            type="button"
            onClick={() =>
              runAction(
                isFeatured
                  ? "unfeature"
                  : "feature"
              )
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-50 px-3 py-2 text-xs font-extrabold text-yellow-700 disabled:opacity-60"
          >
            {activeAction === "feature" ||
            activeAction === "unfeature" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" />
            )}

            {isFeatured
              ? "Retirer vedette"
              : "Vedette"}
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("notify")
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700 disabled:opacity-60"
          >
            {activeAction === "notify" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}

            Notifier
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("archive")
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 disabled:opacity-60"
          >
            {activeAction === "archive" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}

            Archiver
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() =>
          runAction("delete")
        }
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 disabled:opacity-60"
      >
        {activeAction === "delete" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}

        Supprimer
      </button>
    </div>
  );
}