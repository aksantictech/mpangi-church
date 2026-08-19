"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

async function getAuthenticatedUser() {
  await requireAuthenticatedAccess();

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Utilisateur non connecté.");
  }

  return user;
}

export async function createAvatarUploadTarget(input: {
  fileName: string;
  fileType: string;
  fileSize: number;
}) {
  const user = await getAuthenticatedUser();

  if (
    !ALLOWED_AVATAR_TYPES.includes(
      input.fileType as (typeof ALLOWED_AVATAR_TYPES)[number]
    )
  ) {
    throw new Error("Format photo non autorisé. Utilisez JPG, PNG ou WEBP.");
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    throw new Error("Le fichier photo est vide ou invalide.");
  }

  if (input.fileSize > MAX_AVATAR_SIZE) {
    throw new Error("La photo ne doit pas dépasser 5 Mo.");
  }

  const safeName = cleanFileName(input.fileName);
  const extension = safeName.split(".").pop() || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;

  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from("avatars")
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    throw new Error(
      `Impossible de préparer l'envoi de la photo: ${
        error?.message || "token d'upload absent"
      }`
    );
  }

  const { data: publicData } = admin.storage.from("avatars").getPublicUrl(path);

  return {
    path,
    token: data.token,
    publicUrl: publicData.publicUrl,
  };
}

export async function updateChurchProfile(formData: FormData) {
  const user = await getAuthenticatedUser();
  const admin = createAdminClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();

  if (!fullName) {
    throw new Error("Le nom complet est obligatoire.");
  }

  if (avatarUrl) {
    const expectedFragment = `/storage/v1/object/public/avatars/${user.id}/`;

    if (!avatarUrl.includes(expectedFragment)) {
      throw new Error("URL de photo de profil non autorisée.");
    }
  }

  const { data: updatedProfile, error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!updatedProfile) {
    throw new Error("Profil utilisateur introuvable.");
  }

  const existingMetadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  const { error: authMetadataError } =
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...existingMetadata,
        full_name: fullName,
        avatar_url: avatarUrl || null,
      },
    });

  if (authMetadataError) {
    console.warn("Profile metadata sync warning:", authMetadataError.message);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}
