"use client";

import Link from "next/link";
import {
  ImagePlus,
  Loader2,
  Save,
  Star,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type PublicationEditData = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image_url: string | null;
  video_url: string | null;
  status: string | null;
  is_featured: boolean | null;
};

type ApiResponse = {
  error?: string;
  publicationId?: string;
};

const MAX_IMAGE_SIZE =
  4 * 1024 * 1024;

const inputClass =
  "mpangi-form-control min-h-12";

export default function PublicationEditForm({
  publication,
}: {
  publication: PublicationEditData;
}) {
  const router = useRouter();
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [removeImage, setRemoveImage] =
    useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentImage =
    previewUrl ||
    (!removeImage
      ? publication.image_url
      : null);

  const initialStatus = [
    "draft",
    "published",
    "archived",
  ].includes(publication.status || "")
    ? publication.status || "draft"
    : "draft";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget
    );

    formData.set(
      "publicationId",
      publication.id
    );

    formData.set(
      "removeImage",
      String(removeImage)
    );

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/publications",
        {
          method: "PUT",
          body: formData,
        }
      );

      const payload =
        (await response
          .json()
          .catch(() => ({}))) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Modification impossible."
        );
      }

      router.push(
        "/publications?updated=1"
      );
      router.refresh();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Modification impossible."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[1.75rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6"
    >
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Titre *
          </span>

          <input
            name="title"
            required
            maxLength={180}
            defaultValue={publication.title}
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Type
          </span>

          <select
            name="publicationType"
            defaultValue={
              publication.category ||
              "news"
            }
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

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Statut
          </span>

          <select
            name="status"
            defaultValue={initialStatus}
            className={inputClass}
          >
            <option value="draft">
              Brouillon
            </option>
            <option value="published">
              Publié
            </option>
            <option value="archived">
              Archivé
            </option>
          </select>
        </label>

        <label className="flex min-h-12 items-center gap-3 self-end rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-sm font-black text-slate-700">
          <input
            name="isFeatured"
            type="checkbox"
            defaultChecked={Boolean(
              publication.is_featured
            )}
            className="h-5 w-5 rounded border-[#B8CCDC]"
          />

          <Star className="h-4 w-4 text-amber-500" />
          Mettre en vedette
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black text-[#03357A]">
            Lien vidéo YouTube
          </span>

          <input
            name="videoUrl"
            type="url"
            defaultValue={
              publication.video_url || ""
            }
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
            defaultValue={
              publication.excerpt || ""
            }
            className="mpangi-form-control min-h-28 py-3"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-black text-[#03357A]">
            Contenu complet
          </span>

          <textarea
            name="content"
            maxLength={10000}
            defaultValue={
              publication.content || ""
            }
            className="mpangi-form-control min-h-48 py-3"
          />
        </label>
      </div>

      <section>
        <h2 className="text-sm font-black text-[#03357A]">
          Photo de couverture
        </h2>

        {currentImage ? (
          <div className="mt-3 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={publication.title}
              className="aspect-[16/7] w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-3 flex min-h-48 items-center justify-center rounded-3xl border-2 border-dashed border-[#C9DBEA] bg-[#F8FBFD]">
            <div className="text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-[#3F79B3]" />
              <p className="mt-2 text-sm font-bold text-slate-500">
                Aucune photo
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]">
            <ImagePlus className="h-4 w-4" />
            Choisir une photo

            <input
              ref={fileInputRef}
              name="coverImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (!file) return;

                if (
                  file.size >
                  MAX_IMAGE_SIZE
                ) {
                  setError(
                    "La photo ne peut pas dépasser 4 Mo."
                  );

                  event.currentTarget.value =
                    "";

                  return;
                }

                setPreviewUrl(
                  URL.createObjectURL(file)
                );
                setRemoveImage(false);
                setError("");
              }}
            />
          </label>

          {currentImage && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setRemoveImage(true);

                if (
                  fileInputRef.current
                ) {
                  fileInputRef.current.value =
                    "";
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-700"
            >
              <X className="h-4 w-4" />
              Retirer la photo
            </button>
          )}
        </div>

        <p className="mt-2 text-xs font-semibold text-slate-500">
          JPG, PNG ou WebP — maximum 4 Mo.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-[#DCEAF5] pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/publications"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 text-sm font-black text-[#03357A]"
        >
          <X className="h-4 w-4" />
          Annuler
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}

          {isLoading
            ? "Enregistrement..."
            : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}