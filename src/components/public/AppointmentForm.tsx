"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AppointmentFormProps = {
  churchId: string;
};

export default function AppointmentForm({ churchId }: AppointmentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [urgency, setUrgency] = useState("normale");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("appointments").insert({
      church_id: churchId,
      name: name.trim(),
      phone: phone.trim() || null,
      reason: reason.trim(),
      preferred_date: preferredDate || null,
      urgency,
      status: "nouvelle",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage("Votre demande de rendez-vous a bien été envoyée.");

    setName("");
    setPhone("");
    setReason("");
    setPreferredDate("");
    setUrgency("normale");
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
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Motif du rendez-vous *</label>
        <textarea
          rows={5}
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Disponibilité souhaitée</label>
        <input
          type="text"
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          placeholder="Exemple : samedi après-midi, dimanche après le culte..."
          value={preferredDate}
          onChange={(event) => setPreferredDate(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-[#03357A]">Urgence</label>
        <select
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          value={urgency}
          onChange={(event) => setUrgency(event.target.value)}
        >
          <option value="faible">Faible</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

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