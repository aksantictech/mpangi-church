"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TestimonyFormProps = {
  churchId: string;
};

export default function TestimonyForm({ churchId }: TestimonyFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [testimony, setTestimony] = useState("");
  const [canPublish, setCanPublish] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("testimonies").insert({
      church_id: churchId,
      name: name.trim(),
      phone: phone.trim() || null,
      testimony: testimony.trim(),
      can_publish: canPublish,
      status: "nouvelle",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage("Votre témoignage a bien été envoyé. Gloire à Dieu.");

    setName("");
    setPhone("");
    setTestimony("");
    setCanPublish(false);
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
        <label className="text-sm font-bold text-[#03357A]">Votre témoignage *</label>
        <textarea
          rows={7}
          className="mt-2 w-full rounded-2xl border border-[#C9DBEA] px-4 py-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          value={testimony}
          onChange={(event) => setTestimony(event.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={canPublish}
          onChange={(event) => setCanPublish(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          J’autorise l’église à publier ce témoignage après validation.
        </span>
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isLoading ? "Envoi..." : "Envoyer le témoignage"}
      </button>
    </form>
  );
}