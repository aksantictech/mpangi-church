"use client";

import { FormEvent, useMemo, useState } from "react";
import { Save, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileSettingsFormProps = {
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  authEmail: string | null;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#C9DBEA] bg-white px-4 py-4 text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const labelClass = "text-sm font-bold text-[#03357A]";

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "png";
}

export default function ProfileSettingsForm({
  profile,
  authEmail,
}: ProfileSettingsFormProps) {
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [email, setEmail] = useState(profile.email ?? authEmail ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function uploadAvatar(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La photo ne doit pas dépasser 5 Mo.");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format non supporté. Utilisez PNG, JPG ou WEBP.");
    }

    const extension = getFileExtension(file);
    const path = `avatars/${profile.user_id}/avatar-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("profile-avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      let finalAvatarUrl = avatarUrl || null;

      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          avatar_url: finalAvatarUrl,
        })
        .eq("id", profile.id);

      if (error) {
        throw new Error(error.message);
      }

      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          avatar_url: finalAvatarUrl,
        },
      });

      setAvatarUrl(finalAvatarUrl ?? "");
      setAvatarFile(null);
      setSuccessMessage("Profil modifié avec succès.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <section className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
        <h2 className="text-lg font-extrabold text-[#03357A]">
          Informations personnelles
        </h2>

        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <div className="md:w-64">
            <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={fullName || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-[#03357A]">
                  {(fullName || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
              <UploadCloud className="h-4 w-4" />
              Changer la photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>

          <div className="grid flex-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nom complet</label>
              <input
                className={inputClass}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}