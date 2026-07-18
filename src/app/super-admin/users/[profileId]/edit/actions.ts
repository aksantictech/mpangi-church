"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/security/access";
import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
import { createAdminClient } from "@/lib/supabase/admin";
import { USER_ROLE_OPTIONS } from "@/lib/users/userRoles";

const ALLOWED_STATUSES = new Set([
  "active",
  "inactive",
  "suspended",
]);

function readString(
  formData: FormData,
  key: string
) {
  return String(formData.get(key) || "").trim();
}

export async function updateSuperAdminUserAction(
  formData: FormData
) {
  await requireSuperAdminAccess();
  await requireSuperAdmin();

  const profileId = readString(
    formData,
    "profile_id"
  );

  const fullName = readString(
    formData,
    "full_name"
  );

  const email = readString(
    formData,
    "email"
  ).toLowerCase();

  const avatarUrl =
    readString(formData, "avatar_url") || null;

  const role = readString(formData, "role");
  const status = readString(formData, "status");

  const churchId =
    readString(formData, "church_id") || null;

  let errorMessage = "";

  try {
    if (!profileId) {
      throw new Error(
        "Identifiant utilisateur manquant."
      );
    }

    if (!fullName) {
      throw new Error(
        "Le nom complet est obligatoire."
      );
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error(
        "L’adresse email est invalide."
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      throw new Error("Statut invalide.");
    }

    const admin = createAdminClient();

    const {
      data: targetProfile,
      error: targetError,
    } = await admin
      .from("profiles")
      .select(
        "id, user_id, email, role, status, church_id"
      )
      .eq("id", profileId)
      .maybeSingle();

    if (targetError) {
      throw new Error(targetError.message);
    }

    if (!targetProfile) {
      throw new Error(
        "Profil utilisateur introuvable."
      );
    }

    if (targetProfile.role === "super_admin") {
      throw new Error(
        "Le compte Super Admin principal est protégé."
      );
    }

    if (!targetProfile.user_id) {
      throw new Error(
        "Ce profil n’est lié à aucun compte Auth."
      );
    }

   const allowedRoles = new Set<string>(
  USER_ROLE_OPTIONS
    .map((option) => String(option.value))
    .filter((value) => value !== "super_admin")
);
    const keepsLegacyRole =
      role === targetProfile.role;

    if (
      !allowedRoles.has(role) &&
      !keepsLegacyRole
    ) {
      throw new Error("Rôle invalide.");
    }

    if (churchId) {
      const { data: church } = await admin
        .from("churches")
        .select("id")
        .eq("id", churchId)
        .maybeSingle();

      if (!church) {
        throw new Error(
          "L’église sélectionnée est introuvable."
        );
      }
    }

    const { error: authError } =
      await admin.auth.admin.updateUserById(
        targetProfile.user_id,
        {
          email,
          user_metadata: {
            full_name: fullName,
            avatar_url: avatarUrl,
            role,
            status,
            church_id: churchId,
          },
        }
      );

    if (authError) {
      throw new Error(authError.message);
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        avatar_url: avatarUrl,
        role,
        status,
        church_id: churchId,
      })
      .eq("id", profileId);

    if (profileError) {
      throw new Error(profileError.message);
    }
  } catch (error: unknown) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Modification impossible.";
  }

  if (errorMessage) {
    redirect(
      `/super-admin/users/${profileId}/edit?error=${encodeURIComponent(
        errorMessage
      )}`
    );
  }

  revalidatePath("/super-admin/users");
  revalidatePath(
    `/super-admin/users/${profileId}`
  );

  redirect(
    `/super-admin/users/${profileId}?updated=1`
  );
}