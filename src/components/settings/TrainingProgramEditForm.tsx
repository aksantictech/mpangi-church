"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ChurchOption = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  church_id: string | null;
  role: string;
};

type TrainingProgram = {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  status: string;
};

type TrainingProgramEditFormProps = {
  profile: Profile;
  churches: ChurchOption[];
  training: TrainingProgram;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function TrainingProgramEditForm({
  profile,
  churches,
  training,
}: TrainingProgramEditFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [churchId, setChurchId] = useState(training.church_id);
  const [name, setName] = useState(training.name);
  const [description, setDescription] = useState(training.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(training.sort_order ?? 0));
  const [status, setStatus] = useState(training.status);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!name.trim()) {
      setErrorMessage("Le nom de la formation est obligatoire.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("training_programs")
      .update({
        church_id: churchId,
        name: name.trim(),
        description: description.trim() || null,
        sort_order: Number(sortOrder || 0),
        status,
      })
      .eq("id", training.id);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Formation modifiée avec succès.");

    setTimeout(() => {
      router.push(`/settings/trainings/${training.id}`);
      router.refresh();
    }, 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {profile.role === "super_admin" && (
        <div>
          <label className={labelClass}>Église</label>
          <select
            value={churchId}
            onChange={(event) => setChurchId(event.target.value)}
            className={inputClass}
          >
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Nom de la formation *</label>
        <input
          type="text"
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={4}
          className={inputClass}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Ordre d’affichage</label>
        <input
          type="number"
          className={inputClass}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Statut</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={inputClass}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <Save className="h-5 w-5" />
        {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}