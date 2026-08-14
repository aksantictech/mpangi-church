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
    const role = normalizeUserRole(readString(formData, "role"));
    const departmentId = readString(formData, "department_id");
    const isDepartmentResponsible = ["responsable_d", "department_leader"].includes(role);

    if (isDepartmentResponsible && !departmentId) {
      throw new Error("Sélectionnez le département confié au Responsable D.");
    }

    const admin = createAdminClient();
    if (departmentId) {
      const { data: department } = await admin
        .from("departments")
        .select("id")
        .eq("id", departmentId)
        .eq("church_id", profile.church_id)
        .maybeSingle();
      if (!department) throw new Error("Le département sélectionné est invalide.");
    }

    const account = await createOrUpdateUserAccount({
      fullName: readString(formData, "full_name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
      role,
      status: readString(formData, "status") || "active",
      churchId: String(profile.church_id),
      updateExisting: true,
    });

    const { data: targetProfile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", account.id)
      .eq("church_id", profile.church_id)
      .single();
    if (profileError || !targetProfile) {
      throw new Error("Le profil créé n’a pas pu être rattaché au département.");
    }

    const { error: deleteError } = await admin
      .from("profile_department_assignments")
      .delete()
      .eq("profile_id", targetProfile.id)
      .eq("church_id", profile.church_id);
    if (deleteError) throw new Error(deleteError.message);

    if (isDepartmentResponsible && departmentId) {
      const { error: assignmentError } = await admin
        .from("profile_department_assignments")
        .insert({
          profile_id: targetProfile.id,
          church_id: profile.church_id,
          department_id: departmentId,
          created_by: profile.id,
        });
      if (assignmentError) throw new Error(assignmentError.message);
    }
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
