"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2, Radio, Save } from "lucide-react";

type LiveStreamSettingsFormProps = {
  church: {
    live_stream_enabled: boolean | null;
    live_stream_url: string | null;
    live_stream_title: string | null;
    live_stream_description: string | null;
    live_stream_platform: string | null;
    live_stream_notified_at: string | null;
  };
};

const inputClass =
  "h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const textareaClass =
  "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white p-4 text-sm text-[#0F172A] outline-none transition focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default function LiveStreamSettingsForm({
  church,
}: LiveStreamSettingsFormProps) {
  const router = useRouter();

  const [enabled, setEnabled] = useState(Boolean(church.live_stream_enabled));
  const [url, setUrl] = useState(church.live_stream_url || "");
  const [title, setTitle] = useState(
    church.live_stream_title || "Culte en direct"
  );
  const [description, setDescription] = useState(
    church.live_stream_description ||
      "Le culte en direct vient de commencer. Cliquez pour suivre."
  );
  const [platform, setPlatform] = useState(church.live_stream_platform || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitForm(notify: boolean) {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/settings/live-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        liveStreamEnabled: enabled,
        liveStreamUrl: url,
        liveStreamTitle: title,
        liveStreamDescription: description,
        liveStreamPlatform: platform,
        notify,
      }),
    });

    const payload = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      alert(payload.error || "Erreur pendant l’enregistrement.");
      return;
    }

    setMessage(
      notify
        ? `Direct publié. Notifications envoyées : ${payload.sentCount || 0}.`
        : "Direct enregistré."
    );

    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitForm(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Radio className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Informations du direct
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ce lien sera affiché sur la page publique de l’église.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FBFD] p-4">
          <div>
            <p className="font-extrabold text-[#03357A]">
              Afficher le culte en direct
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Si activé, le bouton “Regarder le direct” apparaît sur la page
              publique.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEnabled((current) => !current)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold ${
              enabled
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {enabled ? "Activé" : "Désactivé"}
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Lien du direct
          </label>

          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className={inputClass}
            placeholder="https://youtube.com/live/..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Titre
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            placeholder="Culte en direct"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Plateforme
          </label>

          <input
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            className={inputClass}
            placeholder="YouTube, Facebook, Zoom..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#03357A]">
            Message de notification
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] hover:bg-[#EAF3FA] disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          Enregistrer
        </button>

        <button
          type="button"
          onClick={() => void submitForm(true)}
          disabled={isLoading || !enabled}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}

          Publier et notifier
        </button>
      </div>
    </form>
  );
}