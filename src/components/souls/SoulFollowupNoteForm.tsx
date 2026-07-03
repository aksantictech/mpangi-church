"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SoulFollowupNoteFormProps = {
  churchId: string;
  followupId: string;
  profileId: string;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

export default function SoulFollowupNoteForm({
  churchId,
  followupId,
  profileId,
}: SoulFollowupNoteFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [noteType, setNoteType] = useState("note");
  const [note, setNote] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!note.trim()) {
      setErrorMessage("La note est obligatoire.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("soul_followup_notes").insert({
      church_id: churchId,
      followup_id: followupId,
      note: note.trim(),
      note_type: noteType,
      created_by: profileId,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    await supabase
      .from("soul_followups")
      .update({
        last_contact_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", followupId);

    setSuccessMessage("Note ajoutée avec succès.");
    setNote("");
    setNoteType("note");
    setIsLoading(false);

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className={labelClass}>Type de note</label>
        <select
          value={noteType}
          onChange={(event) => setNoteType(event.target.value)}
          className={inputClass}
        >
          <option value="note">Note pastorale</option>
          <option value="appel">Appel téléphonique</option>
          <option value="visite">Visite</option>
          <option value="priere">Prière</option>
          <option value="integration">Intégration</option>
          <option value="formation">Formation</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Nouvelle note *</label>
        <textarea
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass}
          placeholder="Ex : Appel effectué, la personne souhaite être visitée samedi..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-4 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <MessageSquarePlus className="h-5 w-5" />
        {isLoading ? "Ajout..." : "Ajouter la note"}
      </button>
    </form>
  );
}