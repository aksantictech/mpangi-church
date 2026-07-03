"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Save } from "lucide-react";
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

type TrainingProgramFormProps = {
  profile: Profile;
  churches: ChurchOption[];
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function TrainingProgramForm({
  profile,
  churches,
}: TrainingProgramFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [churchId, setChurchId] = useState(
    profile.church_id ?? churches[0]?.id ?? ""
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!churchId) {
      setErrorMessage("Aucune église sélectionnée.");
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Le nom de la formation est obligatoire.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("training_programs").insert({
      church_id: churchId,
      name: name.trim(),
      description: description.trim() || null,
      sort_order: Number(sortOrder || 0),
      status: "active",
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        setErrorMessage("Cette formation existe déjà pour cette église.");
      } else {
        setErrorMessage(error.message);
      }

      setIsLoading(false);
      return;
    }

    setSuccessMessage("Formation ajoutée avec succès.");

    setName("");
    setDescription("");
    setSortOrder("0");
    setIsLoading(false);

    router.refresh();
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
          <label className={labelClass}>Église *</label>
          <select
            className={inputClass}
            value={churchId}
            onChange={(event) => setChurchId(event.target.value)}
            required
          >
            <option value="">Sélectionner une église</option>

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
          placeholder="Ex : PCNC 1, Fondements, Baptême, Leadership..."
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
          placeholder="Petite description de cette formation..."
        />
      </div>

      <div>
        <label className={labelClass}>Ordre d’affichage</label>
        <input
          type="number"
          className={inputClass}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Ex : 1, 2, 3..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <Save className="h-5 w-5" />
        {isLoading ? "Enregistrement..." : "Ajouter la formation"}
      </button>

      <div className="rounded-2xl bg-[#F8FBFD] p-4 text-sm leading-6 text-slate-500">
        <div className="mb-2 flex items-center gap-2 font-bold text-[#03357A]">
          <GraduationCap className="h-4 w-4" />
          Exemple
        </div>

        Pour ICC, vous pouvez créer : PCNC 1, PCNC 2, PCNC 3, PCNC 4.
        Pour une autre église, vous pouvez créer ses propres formations.
      </div>
    </form>
  );
}