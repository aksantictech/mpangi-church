"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export async function updateChurchProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Utilisateur non connecté.");
  }

  const admin = createAdminClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const avatarFile = formData.get("avatar") as File | null;

  let avatarUrl = String(formData.get("current_avatar_url") || "").trim();

  if (avatarFile && avatarFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(avatarFile.type)) {
      throw new Error("Format photo non autorisé. Utilisez JPG, PNG ou WEBP.");
    }

    if (avatarFile.size > 5 * 1024 * 1024) {
      throw new Error("La photo ne doit pas dépasser 5 Mo.");
    }

    const extension = cleanFileName(avatarFile.name).split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, avatarFile, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(path);
    avatarUrl = publicUrl.publicUrl;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName || user.email?.split("@")[0] || "Utilisateur",
      phone,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
