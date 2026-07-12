"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

type StepStatus = "pending" | "in_progress" | "done" | "blocked";

type Step = {
  id: string;
  step_key: string;
  label: string;
  description: string | null;
  status: StepStatus;
  sort_order: number;
  notes: string | null;
  completed_at: string | null;
};

type Payload = {
  church: {
    id: string;
    name: string;
    slug: string;
  };
  steps: Step[];
  totalSteps: number;
  doneSteps: number;
  blockedSteps: number;
  progress: number;
};

const statusMeta: Record<StepStatus, { label: string; className: string; icon: any }> = {
  pending: {
    label: "À faire",
    className: "bg-slate-100 text-slate-700",
    icon: Clock,
  },
  in_progress: {
    label: "En cours",
    className: "bg-blue-50 text-blue-700",
    icon: Loader2,
  },
  done: {
    label: "Validé",
    className: "bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
  blocked: {
    label: "Bloqué",
    className: "bg-orange-50 text-orange-700",
    icon: AlertTriangle,
  },
};

export default function ChurchOnboardingClient({
  initialPayload,
}: {
  initialPayload: Payload;
}) {
  const [payload, setPayload] = useState(initialPayload);
  const [busy, setBusy] = useState("");

  async function runAction(action: string, extra?: Record<string, unknown>) {
    setBusy(action + String(extra?.stepId || ""));

    try {
      const response = await fetch("/api/super-admin/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          churchId: payload.church.id,
          action,
          ...extra,
        }),
      });

      const nextPayload = await response.json();

      if (!response.ok) {
        throw new Error(nextPayload.error || "Action impossible.");
      }

      setPayload(nextPayload);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Progression</p>
          <p className="mt-2 text-3xl font-black text-[#03357A]">
            {payload.progress}%
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#EAF3FA]">
            <div
              className="h-full rounded-full bg-[#03357A]"
              style={{ width: `${payload.progress}%` }}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Étapes validées</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {payload.doneSteps}/{payload.totalSteps}
          </p>
        </article>

        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Bloquées</p>
          <p className="mt-2 text-3xl font-black text-orange-700">
            {payload.blockedSteps}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => runAction("complete_all")}
            disabled={Boolean(busy)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {busy === "complete_all" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Tout valider
          </button>

          <button
            type="button"
            onClick={() => runAction("reset")}
            disabled={Boolean(busy)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {payload.steps.map((step) => {
          const meta = statusMeta[step.status];
          const Icon = meta.icon;

          return (
            <article
              key={step.id}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-black text-[#03357A]">
                      {step.sort_order}. {step.label}
                    </h2>

                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${meta.className}`}>
                      <Icon className={`h-4 w-4 ${step.status === "in_progress" ? "animate-spin" : ""}`} />
                      {meta.label}
                    </span>
                  </div>

                  {step.description && (
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>
                  )}

                  {step.notes && (
                    <p className="mt-3 rounded-2xl bg-[#F8FBFD] p-3 text-sm font-semibold leading-6 text-slate-600">
                      {step.notes}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                  {(["pending", "in_progress", "done", "blocked"] as StepStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() =>
                          runAction("set_step", {
                            stepId: step.id,
                            status,
                            notes: step.notes || "",
                          })
                        }
                        className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                          step.status === status
                            ? "bg-[#03357A] text-white"
                            : "bg-[#F8FBFD] text-[#03357A] hover:bg-[#EAF3FA]"
                        }`}
                      >
                        {statusMeta[status].label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
