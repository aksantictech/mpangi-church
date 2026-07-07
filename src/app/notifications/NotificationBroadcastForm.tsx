"use client";

import { FormEvent, useState } from "react";
import { BellRing, Loader2, Send } from "lucide-react";

type NotificationBroadcastFormProps = {
  subscribersCount: number;
};

export default function NotificationBroadcastForm({
  subscribersCount,
}: NotificationBroadcastFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    setMessage("");
    setIsError(false);
    setIsPending(true);

    try {
      const response = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          url,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(payload.error || "Impossible d’envoyer la notification.");
        return;
      }

      setMessage(
        `Notification envoyée : ${payload.sentCount ?? 0} réussite(s), ${
          payload.failedCount ?? 0
        } échec(s).`
      );

      setTitle("");
      setBody("");
      setUrl("/");
    } catch {
      setIsError(true);
      setMessage("Erreur pendant l’envoi de la notification.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <BellRing className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Envoyer une annonce
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Cette notification sera envoyée aux appareils abonnés à cette
            église. Appareils disponibles :{" "}
            <span className="font-extrabold text-[#03357A]">
              {subscribersCount}
            </span>
            .
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-extrabold text-[#03357A]">
              Titre
            </span>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={70}
              required
              placeholder="Ex : Culte spécial ce dimanche"
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-extrabold text-[#03357A]">
              Lien d’ouverture
            </span>

            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/ ou /church/iccrdc"
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-extrabold text-[#03357A]">
            Message
          </span>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={180}
            required
            rows={4}
            placeholder="Ex : Nous vous invitons au culte de ce dimanche à 09h00. Venez nombreux."
            className="w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
          />

          <span className="text-xs font-semibold text-slate-400">
            {body.length}/180 caractères
          </span>
        </label>

        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${
              isError
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Conseil : gardez le message court pour une meilleure lisibilité sur
            téléphone.
          </p>

          <button
            type="submit"
            disabled={isPending || subscribersCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer notification
          </button>
        </div>
      </form>
    </section>
  );
}
