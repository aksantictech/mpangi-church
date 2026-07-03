"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Training = {
  id: string;
  title: string | null;
  status: string | null;
};

type Assignment = {
  id: string;
  church_id: string;
  member_id: string;
  training_id: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  trainings:
    | {
        id: string;
        title: string | null;
      }
    | {
        id: string;
        title: string | null;
      }[]
    | null;
};

type MemberTrainingsManagerProps = {
  memberId: string;
  churchId: string;
  profileId: string;
  trainings: Training[];
  assignments: Assignment[];
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClass(status?: string | null) {
  if (status === "terminee") return "bg-green-50 text-green-700";
  if (status === "abandonnee") return "bg-red-50 text-red-700";
  if (status === "en_cours") return "bg-blue-50 text-blue-700";

  return "bg-slate-100 text-slate-600";
}

export default function MemberTrainingsManager({
  memberId,
  churchId,
  profileId,
  trainings,
  assignments,
}: MemberTrainingsManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [trainingId, setTrainingId] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const assignedTrainingIds = new Set(
    assignments.map((assignment) => assignment.training_id)
  );

  const availableTrainings = trainings.filter(
    (training) => !assignedTrainingIds.has(training.id)
  );

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trainingId) {
      alert("Veuillez choisir une formation.");
      return;
    }

    setIsLoading(true);

const { error } = await supabase.from("member_trainings").insert({
  church_id: churchId,
  member_id: memberId,
  training_id: trainingId,
  status: "en_cours",
  started_at: new Date().toISOString().slice(0, 10),
  completed_at: null,
  notes: notes.trim() || null,
  created_by: profileId,
});

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTrainingId("");
    setNotes("");
    router.refresh();
  }

  async function handleComplete(assignmentId: string) {
    const confirmed = window.confirm(
      "Voulez-vous marquer cette formation comme terminée ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("member_trainings")
      .update({
        status: "terminee",
        completed_at: new Date().toISOString().slice(0, 10),
      })
      .eq("id", assignmentId)
      .eq("member_id", memberId)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  async function handleRemove(assignmentId: string) {
    const confirmed = window.confirm(
      "Voulez-vous retirer cette formation du membre ?"
    );

    if (!confirmed) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("member_trainings")
      .delete()
      .eq("id", assignmentId)
      .eq("member_id", memberId)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAssign}
        className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <BookOpenCheck className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Inscrire à une formation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sélectionnez une formation disponible dans votre église.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#03357A]">
              Formation
            </span>

            <select
              value={trainingId}
              onChange={(event) => setTrainingId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            >
              <option value="">Choisir une formation</option>

              {availableTrainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title || "Formation sans titre"}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#03357A]">
              Note
            </span>

            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              placeholder="Ex : inscrit au parcours de base"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !trainingId}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Ajouter
            </button>
          </div>
        </div>

        {availableTrainings.length === 0 && (
          <p className="mt-4 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-semibold text-slate-500">
            Toutes les formations actives sont déjà associées à ce membre.
          </p>
        )}
      </form>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#03357A]">
          Formations du membre
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Suivez le parcours de formation de ce membre.
        </p>

        <div className="mt-6 space-y-3">
          {assignments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#C9DBEA] bg-[#F8FBFD] p-8 text-center">
              <BookOpenCheck className="mx-auto h-10 w-10 text-[#3F79B3]" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Ce membre n’est inscrit à aucune formation.
              </p>
            </div>
          )}

          {assignments.map((assignment) => {
            const training = firstItem(assignment.trainings);

            return (
              <article
                key={assignment.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 md:flex-row md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-[#03357A]">
                      {training?.title || "Formation"}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                        assignment.status
                      )}`}
                    >
                      {assignment.status || "en_cours"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Début : {formatDate(assignment.started_at)} • Fin :{" "}
                    {formatDate(assignment.completed_at)}
                  </p>

                  {assignment.notes && (
                    <p className="mt-2 text-sm text-slate-600">
                      {assignment.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {assignment.status !== "terminee" && (
                    <button
                      type="button"
                      onClick={() => handleComplete(assignment.id)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Terminer
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(assignment.id)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Retirer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}