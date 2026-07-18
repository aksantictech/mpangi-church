"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  CheckCircle2,
  FileText,
  Loader2,
  PlayCircle,
} from "lucide-react";

type EventAction =
  | "activate"
  | "draft"
  | "complete"
  | "cancel";

type EventActionsProps = {
  eventId: string;
  currentStatus: string | null;
};

type ApiResponse = {
  error?: string;
  status?: string;
};

type ActionIconProps = {
  action: EventAction;
  activeAction: EventAction | null;
  icon: LucideIcon;
};

function ActionIcon({
  action,
  activeAction,
  icon: Icon,
}: ActionIconProps) {
  if (activeAction === action) {
    return (
      <Loader2 className="h-4 w-4 animate-spin" />
    );
  }

  return <Icon className="h-4 w-4" />;
}

export default function EventActions({
  eventId,
  currentStatus,
}: EventActionsProps) {
  const router = useRouter();

  const [activeAction, setActiveAction] =
    useState<EventAction | null>(null);

  const isLoading = activeAction !== null;

  async function runAction(
    action: EventAction
  ) {
    if (action === "complete") {
      const confirmed = window.confirm(
        "Marquer cet événement comme terminé ?"
      );

      if (!confirmed) return;
    }

    if (action === "cancel") {
      const confirmed = window.confirm(
        "Voulez-vous vraiment annuler cet événement ?"
      );

      if (!confirmed) return;
    }

    setActiveAction(action);

    try {
      const response = await fetch(
        "/api/events",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            eventId,
            action,
          }),
        }
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        window.alert(
          payload.error ||
            "Action impossible."
        );
        return;
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
    <div className="contents">
      {currentStatus !== "active" && (
        <button
          type="button"
          onClick={() =>
            runAction("activate")
          }
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 disabled:opacity-60"
        >
          <ActionIcon
            action="activate"
            activeAction={activeAction}
            icon={PlayCircle}
          />
          Activer
        </button>
      )}

      {currentStatus === "active" && (
        <>
          <button
            type="button"
            onClick={() =>
              runAction("complete")
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 disabled:opacity-60"
          >
            <ActionIcon
              action="complete"
              activeAction={activeAction}
              icon={CheckCircle2}
            />
            Terminer
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("draft")
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
          >
            <ActionIcon
              action="draft"
              activeAction={activeAction}
              icon={FileText}
            />
            Brouillon
          </button>
        </>
      )}

      {currentStatus !== "cancelled" &&
        currentStatus !== "completed" && (
          <button
            type="button"
            onClick={() =>
              runAction("cancel")
            }
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60"
          >
            <ActionIcon
              action="cancel"
              activeAction={activeAction}
              icon={Ban}
            />
            Annuler l’événement
          </button>
        )}
    </div>
  );
}