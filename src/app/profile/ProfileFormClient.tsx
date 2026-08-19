"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createAvatarUploadTarget,
  updateChurchProfile,
} from "./actions";

type InitialProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: string;
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileFormClient({
  initialProfile,
}: {
  initialProfile: InitialProfile;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialProfile.avatarUrl);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(initialProfile.avatarUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, initialProfile.avatarUrl]);

  function handleFileChange(file: File | null) {
    setError("");
    setMessage("");

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Format non autorisé. Utilisez JPG, PNG ou WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("La photo ne doit pas dépasser 5 Mo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAvatarFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    try {
      let avatarUrl = initialProfile.avatarUrl;

      if (avatarFile) {
        const target = await createAvatarUploadTarget({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
          fileSize: avatarFile.size,
        });

        const supabase = createClient();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .uploadToSignedUrl(target.path, target.token, avatarFile, {
            contentType: avatarFile.type,
            cacheControl: "3600",
          });

        if (uploadError) {
          throw new Error(`Échec de l'envoi de la photo: ${uploadError.message}`);
        }

        avatarUrl = target.publicUrl;
      }

      const formData = new FormData();
      formData.set("full_name", fullName);
      formData.set("phone", phone);
      formData.set("avatar_url", avatarUrl);

      await updateChurchProfile(formData);

      setAvatarFile(null);
      setPreviewUrl(avatarUrl);
      setMessage("Profil mis à jour avec succès.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de mettre à jour le profil."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center rounded-3xl bg-[#F8FBFD] p-5 md:w-64">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={fullName}
              className="h-32 w-32 rounded-[2rem] object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[#03357A] text-white">
              <UserRound className="h-14 w-14" />
            </div>
          )}

          <label className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A]">
            <Camera className="h-4 w-4" />
            Changer la photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={pending}
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] || null)
              }
            />
          </label>

          <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500">
            JPG, PNG ou WEBP. Maximum 5 Mo.
          </p>
        </div>

        <div className="grid flex-1 gap-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {message}
            </div>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Nom complet
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              required
              disabled={pending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Email</span>
            <input
              value={initialProfile.email}
              readOnly
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-slate-50 px-4 text-sm font-bold text-slate-500 outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Téléphone
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              placeholder="+243..."
              disabled={pending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Rôle</span>
            <input
              value={initialProfile.role}
              readOnly
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-slate-50 px-4 text-sm font-bold text-slate-500 outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {pending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </form>
  );
}
