"use client";

import { FormEvent, useState } from "react";
import { BellRing, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

const inputClass =
  "h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const textareaClass =
  "min-h-28 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default function PublicationForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/publications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        content: form.get("content"),
        publicationType: form.get("publicationType"),
        videoUrl: form.get("videoUrl"),
        isPublished: form.get("isPublished") === "on",
        isFeatured: form.get("isFeatured") === "on",
        notify: form.get("notify") === "on",
      }),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(payload.error || "Erreur pendant l’enregistrement.");
      return;
    }

    formElement.reset();

    setMessage(
      payload.warning ||
        `Publication enregistrée. Notifications envoyées : ${
          payload.sentCount || 0
        }.`
    );

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-extrabold text-[#03357A]">
        Nouvelle publication
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Publiez une vidéo, un enseignement, une prédication ou un message
        d’édification.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Titre *
          </label>
          <input name="title" required className={inputClass} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Type
          </label>
          <select
            name="publicationType"
            defaultValue="teaching"
            className={inputClass}
          >
            <option value="teaching">Enseignement</option>
            <option value="sermon">Prédication</option>
            <option value="video">Vidéo</option>
            <option value="message">Message d’édification</option>
            <option value="announcement">Annonce</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Lien vidéo YouTube
          </label>
          <input
            name="videoUrl"
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Résumé court
          </label>
          <textarea
            name="description"
            className={textareaClass}
            placeholder="Résumé visible sur la page publique..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Contenu / notes
          </label>
          <textarea
            name="content"
            className={textareaClass}
            placeholder="Texte complet, passage biblique, points importants..."
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600">
          <input name="isPublished" type="checkbox" className="h-4 w-4" />
          Publier sur la page publique
        </label>

        <label className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600">
          <input name="isFeatured" type="checkbox" className="h-4 w-4" />
          Mettre en vedette
        </label>

        <label className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4 text-sm font-bold text-slate-600">
          <input name="notify" type="checkbox" className="h-4 w-4" />
          Notifier les abonnés
        </label>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          Publier
          <BellRing className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}