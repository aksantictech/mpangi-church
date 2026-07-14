"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
const ALLOWED_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "charge_afp",
]);

const ALLOWED_STATUSES = new Set([
  "pending",
  "awaiting_payment",
  "submitted",
  "confirmed",
  "cancelled",
  "failed",
]);

async function getContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth_required");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, role, church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !profile.church_id ||
    !ALLOWED_ROLES.has(String(profile.role))
  ) {
    redirect("/unauthorized?reason=donations_access");
  }

  return {
    admin,
    userId: user.id,
    churchId: String(profile.church_id),
  };
}

export async function updateDonationStatusAction(
  formData: FormData
) {
  await requireAnyActionPermission(["donations"], "update");
  const { admin, userId, churchId } = await getContext();

  const donationId = String(formData.get("donation_id") || "");
  const status = String(formData.get("status") || "");

  if (!donationId || !ALLOWED_STATUSES.has(status)) {
    redirect("/finance/donations?error=invalid_update");
  }

  const payload: Record<string, unknown> = {
    status,
  };

  if (status === "confirmed") {
    payload.confirmed_at = new Date().toISOString();
    payload.confirmed_by = userId;
  } else {
    payload.confirmed_at = null;
    payload.confirmed_by = null;
  }

  const { error } = await admin
    .from("church_donations")
    .update(payload)
    .eq("id", donationId)
    .eq("church_id", churchId);

  if (error) {
    redirect(
      `/finance/donations?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath("/finance/donations");
}
