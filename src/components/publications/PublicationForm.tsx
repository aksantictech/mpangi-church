"use client";

import {
  BellRing,
  CalendarDays,
  ImagePlus,
  Loader2,
  Send,
  Star,
  X,
} from "lucide-react";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "mpangi-form-control min-h-12";

const textareaClass =
  "mpangi-form-control min-h-28 py-3";

const MAX_IMAGE_SIZE =
  4 * 1024 * 1024;


async function readApiPayload(
  response: Response
) {
  const raw =
    await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {
      error:
        raw.slice(0, 500) ||
        `Erreur HTTP ${response.status}`,
    };
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMilliseconds: number
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, timeoutMilliseconds);

  try {
    return await fetch(input, {
      ...init,
      signal:
        controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export default function PublicationForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(
    null
  );

  const [
    selectedFileName,
    setSelectedFileName,
  ] = useState("");

  const previewStyle =
    useMemo(
      () =>
        previewUrl
          ? {
              backgroundImage: `url("${previewUrl}")`,
            }
          : undefined,
      [previewUrl]
    );

  function clearImage(
    input?: HTMLInputElement | null
  ) {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl(null);
    setSelectedFileName("");

    if (input) {
      input.value = "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formElement =
      event.currentTarget;

    const form =
      new FormData(formElement);

    const image =
      form.get("coverImage");

    if (
      image instanceof File &&
      image.size >
        MAX_IMAGE_SIZE
    ) {
      setError(
        "La photo ne peut pas dépasser 4 Mo."
      );
      return;
    }

    const notifyRequested =
      form.get("notify") === "on";

    /*
     * L’enregistrement et l’envoi Push sont volontairement séparés.
     * Une panne VAPID ne doit jamais annuler la publication.
     */
    if (notifyRequested) {
      form.set(
        "notify",
        "false"
      );

      form.set(
        "isPublished",
        "on"
      );
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response =
        await fetchWithTimeout(
          "/api/publications",
          {
            method: "POST",
            body: form,
          },
          45000
        );

      const payload =
        await readApiPayload(
          response
        );

      if (!response.ok) {
        const detail = [
          payload.error,
          payload.details,
          payload.hint,
        ]
          .filter(Boolean)
          .join(" — ");

        throw new Error(
          detail ||
            "Erreur pendant l’enregistrement."
        );
      }

      let successMessage =
        "Publication enregistrée.";

      if (
        notifyRequested &&
        payload.publicationId
      ) {
        try {
          const notifyResponse =
            await fetchWithTimeout(
              "/api/publications",
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    publicationId:
                      payload.publicationId,
                    action: "notify",
                  }),
              },
              20000
            );

          const notifyPayload =
            await readApiPayload(
              notifyResponse
            );

          if (!notifyResponse.ok) {
            successMessage +=
              ` Notification non envoyée : ${
                notifyPayload.error ||
                "erreur Push"
              }.`;
          } else {
            successMessage =
              notifyPayload.warning ||
              `Publication enregistrée. Notifications envoyées : ${
                notifyPayload.sentCount ||
                0
              }.`;
          }
        } catch (
          notifyError: any
        ) {
          successMessage +=
            ` Notification non envoyée : ${
              notifyError?.name ===
              "AbortError"
                ? "délai dépassé"
                : notifyError?.message ||
                  "erreur réseau"
            }.`;
        }
      }

      formElement.reset();
      clearImage();

      setMessage(
        successMessage
      );

      router.refresh();
    } catch (
      submitError: any
    ) {
      setError(
        submitError?.name ===
          "AbortError"
          ? "Le serveur a mis trop de temps à répondre. La publication n’a pas été confirmée."
          : submitError?.message ||
            "Une erreur a empêché la publication."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3F79B3]">
            Communication
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#03357A]">
            Nouvelle publication
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Publiez une actualité,
            un événement, une
            annonce, une vidéo ou
            un enseignement. Une
            photo peut être mise en
            vedette sur la page
            publique.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-xs font-black text-[#03357A]">
          <CalendarDays className="h-4 w-4" />
          Visible immédiatement si
          « Publier » est coché
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold leading-6 text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Titre *
          </span>

          <input
            name="title"
            required
            maxLength={180}
            className={inputClass}
            placeholder="Titre de la publication"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Type
          </span>

          <select
            name="publicationType"
            defaultValue="news"
            className={inputClass}
          >
            <option value="news">
              Actualité
            </option>
            <option value="event">
              Événement
            </option>
            <option value="announcement">
              Annonce
            </option>
            <option value="teaching">
              Enseignement
            </option>
            <option value="sermon">
              Prédication
            </option>
            <option value="video">
              Vidéo
            </option>
            <option value="message">
              Message d’édification
            </option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black text-[#03357A]">
            Lien vidéo YouTube
          </span>

          <input
            name="videoUrl"
            type="url"
            className={inputClass}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black text-[#03357A]">
            Résumé court
          </span>

          <textarea
            name="description"
            maxLength={1000}
            className={textareaClass}
            placeholder="Résumé visible sur la page publique..."
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black text-[#03357A]">
            Contenu complet
          </span>

          <textarea
            name="content"
            maxLength={10000}
            className="mpangi-form-control min-h-40 py-3"
            placeholder="Texte complet, programme, passage biblique, informations pratiques..."
          />
        </label>

        <div className="md:col-span-2">
          <p className="text-sm font-black text-[#03357A]">
            Photo de couverture
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            JPG, PNG ou WebP. Maximum
            4 Mo. Ratio conseillé :
            16:9.
          </p>

          <label className="mt-3 block cursor-pointer">
            <input
              name="coverImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file =
                  event.target
                    .files?.[0];

                if (!file) {
                  clearImage(
                    event.currentTarget
                  );
                  return;
                }

                if (
                  file.size >
                  MAX_IMAGE_SIZE
                ) {
                  setError(
                    "La photo ne peut pas dépasser 4 Mo."
                  );
                  clearImage(
                    event.currentTarget
                  );
                  return;
                }

                if (previewUrl) {
                  URL.revokeObjectURL(
                    previewUrl
                  );
                }

                setPreviewUrl(
                  URL.createObjectURL(
                    file
                  )
                );

                setSelectedFileName(
                  file.name
                );

                setError("");
              }}
            />

            <div
              className={[
                "relative flex min-h-52 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed bg-[#F8FBFD] bg-cover bg-center p-5 transition",
                previewUrl
                  ? "border-[#2563EB]"
                  : "border-[#C9DBEA] hover:border-[#03357A]",
              ].join(" ")}
              style={previewStyle}
            >
              {previewUrl && (
                <div className="absolute inset-0 bg-slate-950/25" />
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-lg">
                  <ImagePlus className="h-7 w-7" />
                </div>

                <p
                  className={[
                    "mt-3 max-w-xs text-sm font-black",
                    previewUrl
                      ? "text-white"
                      : "text-[#03357A]",
                  ].join(" ")}
                >
                  {selectedFileName ||
                    "Choisir une photo"}
                </p>

                <p
                  className={[
                    "mt-1 text-xs font-semibold",
                    previewUrl
                      ? "text-white/90"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  Touchez pour remplacer
                  l’image
                </p>
              </div>
            </div>
          </label>

          {previewUrl && (
            <button
              type="button"
              onClick={() => {
                const input =
                  document.querySelector<HTMLInputElement>(
                    'input[name="coverImage"]'
                  );

                clearImage(input);
              }}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-black text-red-700"
            >
              <X className="h-4 w-4" />
              Retirer la photo
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm font-black text-slate-700">
          <input
            name="isPublished"
            type="checkbox"
            className="h-5 w-5 rounded border-[#B8CCDC]"
          />
          Publier sur la page
          publique
        </label>

        <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm font-black text-slate-700">
          <input
            name="isFeatured"
            type="checkbox"
            className="h-5 w-5 rounded border-[#B8CCDC]"
          />
          <Star className="h-4 w-4 text-amber-500" />
          Mettre en vedette
        </label>

        <label className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm font-black text-slate-700">
          <input
            name="notify"
            type="checkbox"
            className="h-5 w-5 rounded border-[#B8CCDC]"
          />
          <BellRing className="h-4 w-4 text-green-600" />
          Notifier les abonnés
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}

          {isLoading
            ? "Publication en cours..."
            : "Enregistrer la publication"}
        </button>
      </div>
    </form>
  );
}
