"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PrayerRequestFormProps = {
  churchId: string;
};

export default function PrayerRequestForm({ churchId }: PrayerRequestFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestText, setRequestText] = useState("");
  const [confidentialityLevel, setConfidentialityLevel] = useState("normal");
  const [wantsCallback, setWantsCallback] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("prayer_requests").insert({
      church_id: churchId,
      name: name.trim(),
      phone: phone.trim() || null,
      request_text: requestText.trim(),
      confidentiality_level: confidentialityLevel,
      wants_callback: wantsCallback,
      status: "nouvelle",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage(
      "Votre demande de prière a bien été envoyée. Que Dieu vous fortifie."
    );

    setName("");
    setPhone("");
    setRequestText("");
    setConfidentialityLevel("normal");
    setWantsCallback(false);
    setIsLoading(false);
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

      <div>
        <label className="text-sm font-bold text-[#03357A]">Votre nom *</label>
        <input
          type="text"
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          placeholder="Votre nom complet"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Téléphone / WhatsApp</label>
        <input
          type="text"
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          placeholder="+243..."
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Sujet de prière *</label>
        <textarea
          rows={6}
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          placeholder="Écrivez votre sujet de prière..."
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Confidentialité</label>
        <select
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          value={confidentialityLevel}
          onChange={(event) => setConfidentialityLevel(event.target.value)}
        >
          <option value="normal">Normal</option>
          <option value="confidentiel">Confidentiel</option>
          <option value="pasteur_uniquement">Pasteur uniquement</option>
        </select>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={wantsCallback}
          onChange={(event) => setWantsCallback(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Je souhaite être rappelé(e).
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isLoading ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}