"use server";

import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/security/access";
import { createOrUpdateUserAccount } from "@/lib/users/createUserAccount";
import { normalizeUserRole } from "@/lib/users/userRoles";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function createSuperAdminUserAction(formData: FormData) {
  let target = "/super-admin/users/new";

  try {
    await requireSuperAdmin();

    const fullName = readString(formData, "full_name");
    const email = readString(formData, "email");
    const password = readString(formData, "password");
    const role = normalizeUserRole(readString(formData, "role"));
    const status = readString(formData, "status") || "active";
    const churchId = readString(formData, "church_id") || null;

    await createOrUpdateUserAccount({
      fullName,
      email,
      password,
      role,
      status,
      churchId,
      allowExistingInSameChurch: true,
      allowExistingWithoutChurch: true,
    });

    target = "/super-admin/settings?createdUser=1";
  } catch (error: any) {
    target = `/super-admin/users/new?error=${encodeURIComponent(
      error?.message || "Création impossible."
    )}`;
  }

  redirect(target);
}
