"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createOrUpdateUserAccount } from "@/lib/users/createUserAccount";
import {
  canCreateChurchUsers,
  normalizeUserRole,
} from "@/lib/users/userRoles";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
function readString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?reason=auth_required");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, role, church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect("/unauthorized?reason=profile_missing");
  }

  return profile;
}

export async function createChurchUserAction(formData: FormData) {
  await requireAnyActionPermission(["users"], "create");
  const profile = await getCurrentProfile();

  if (!canCreateChurchUsers(profile.role)) {
    redirect(
      `/settings/users/new?error=${encodeURIComponent(
        "Vous n’avez pas l’autorisation de créer des utilisateurs."
      )}`
    );
  }

  if (!profile.church_id) {
    redirect(
      `/settings/users/new?error=${encodeURIComponent(
        "Votre profil administrateur n’est rattaché à aucune église."
      )}`
    );
  }

  let errorMessage = "";

  try {
    await createOrUpdateUserAccount({
      fullName: readString(formData, "full_name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
      role: normalizeUserRole(readString(formData, "role")),
      status: readString(formData, "status") || "active",
      churchId: String(profile.church_id),
      updateExisting: true,
    });
  } catch (error: any) {
    errorMessage = error?.message || "Création impossible.";
  }

  if (errorMessage) {
    redirect(
      `/settings/users/new?error=${encodeURIComponent(errorMessage)}`
    );
  }

  redirect("/settings/users?createdUser=1");
}
