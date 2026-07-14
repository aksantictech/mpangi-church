"use server";

import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/security/access";
import { createOrUpdateUserAccount } from "@/lib/users/createUserAccount";
import { normalizeUserRole } from "@/lib/users/userRoles";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
function readString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function createSuperAdminUserAction(formData: FormData) {
  await requireSuperAdminAccess();
  await requireSuperAdmin();

  let errorMessage = "";

  try {
    await createOrUpdateUserAccount({
      fullName: readString(formData, "full_name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
      role: normalizeUserRole(readString(formData, "role")),
      status: readString(formData, "status") || "active",
      churchId: readString(formData, "church_id") || null,
      updateExisting: true,
    });
  } catch (error: any) {
    errorMessage = error?.message || "Création impossible.";
  }

  if (errorMessage) {
    redirect(
      `/super-admin/users/new?error=${encodeURIComponent(errorMessage)}`
    );
  }

  redirect("/super-admin/settings?createdUser=1");
}
