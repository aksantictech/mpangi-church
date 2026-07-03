"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemberPhotoUploadFormProps = {
  memberId: string;
  churchId: string;
  memberName: string;
  currentPhotoUrl?: string | null;
};

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "jpg" : "jpg";
}

export default function MemberPhotoUploadForm({
  memberId,
  churchId,
  memberName,
  currentPhotoUrl,
}: MemberPhotoUploadFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoUrl || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("La photo ne doit pas dépasser 3 Mo.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      alert("Veuillez choisir une photo.");
      return;
    }

    setIsLoading(true);

    const extension = getFileExtension(selectedFile.name);
    const filePath = `${churchId}/${memberId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setIsLoading(false);
      alert(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("member-photos")
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("members")
      .update({
        photo_url: photoUrl,
      })
      .eq("id", memberId)
      .eq("church_id", churchId);

    setIsLoading(false);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    router.push(`/members/${memberId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#EAF3FA] text-[#03357A]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={memberName}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle className="h-20 w-20" />
          )}
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-[#03357A]">
          Photo du membre
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Ajoutez une photo claire du membre. Format recommandé : JPG ou PNG,
          maximum 3 Mo.
        </p>

        <label className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]">
          <Camera className="h-4 w-4" />
          Choisir une photo

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {selectedFile.name}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {isLoading ? "Enregistrement..." : "Enregistrer la photo"}
          </button>
        </div>
      </div>
    </form>
  );
}