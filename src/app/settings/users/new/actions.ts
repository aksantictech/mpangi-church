"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createOrUpdateUserAccount } from "@/lib/users/createUserAccount";
import { normalizeUserRole } from "@/lib/users/userRoles";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function go(path: string): never {
  redirect(path);
}

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    go("/login?reason=auth_required");
  }

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, church_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    go("/unauthorized?reason=profile_missing");
  }

  return profile;
}

function canCreateUsers(role: string | null | undefined) {
  return [
    "super_admin",
    "church_admin",
    "admin_eglise",
    "pasteur_t",
    "pastor",
  ].includes(String(role || ""));
}

export async function createChurchUserAction(formData: FormData) {
  let target = "/settings/users/new";

  try {
    const profile = await getCurrentProfile();

    if (!canCreateUsers(profile.role)) {
      throw new Error("Vous n’avez pas l’autorisation de créer des utilisateurs.");
    }

    if (!profile.church_id) {
      throw new Error("Votre profil n’est rattaché à aucune église.");
    }

    const fullName = readString(formData, "full_name");
    const email = readString(formData, "email");
    const password = readString(formData, "password");
    const role = normalizeUserRole(readString(formData, "role"));
    const status = readString(formData, "status") || "active";

    await createOrUpdateUserAccount({
      fullName,
      email,
      password,
      role,
      status,
      churchId: profile.church_id,
      allowExistingInSameChurch: true,
      allowExistingWithoutChurch: true,
    });

    target = "/settings/users?createdUser=1";
  } catch (error: any) {
    target = `/settings/users/new?error=${encodeURIComponent(
      error?.message || "Création impossible."
    )}`;
  }

  redirect(target);
}
