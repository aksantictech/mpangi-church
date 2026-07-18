"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  paymentErrorMessage,
  updatePaymentTransactionStatus,
} from "@/lib/payments/service";
import type { PaymentStatus } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

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

const PAYMENT_STATUS_BY_DONATION_STATUS: Partial<
  Record<string, PaymentStatus>
> = {
  pending: "pending",
  awaiting_payment: "pending",
  submitted: "pending",
  confirmed: "succeeded",
  cancelled: "cancelled",
  failed: "failed",
};

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?reason=auth_required");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_id, role, church_id")
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

export async function updateDonationStatusAction(formData: FormData) {
  await requireAnyActionPermission(["donations"], "update");
  const { admin, userId, churchId } = await getContext();
  const donationId = String(formData.get("donation_id") || "");
  const status = String(formData.get("status") || "");

  if (!donationId || !ALLOWED_STATUSES.has(status)) {
    redirect("/finance/donations?error=invalid_update");
  }

  const { data: donation, error: donationLoadError } = await admin
    .from("church_donations")
    .select("id, payment_transaction_id")
    .eq("id", donationId)
    .eq("church_id", churchId)
    .maybeSingle();

  if (donationLoadError || !donation) {
    redirect("/finance/donations?error=donation_not_found");
  }

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { status };

  if (status === "confirmed") {
    payload.confirmed_at = now;
    payload.confirmed_by = userId;
    payload.paid_at = now;
    payload.last_payment_error = null;
  } else {
    payload.confirmed_at = null;
    payload.confirmed_by = null;

    if (status === "failed") {
      payload.last_payment_error = "Paiement marqué en échec manuellement.";
    }
  }

  const { error } = await admin
    .from("church_donations")
    .update(payload)
    .eq("id", donationId)
    .eq("church_id", churchId);

  if (error) {
    redirect(`/finance/donations?error=${encodeURIComponent(error.message)}`);
  }

  if (donation.payment_transaction_id) {
    const paymentStatus = PAYMENT_STATUS_BY_DONATION_STATUS[status];

    if (paymentStatus) {
      try {
        await updatePaymentTransactionStatus(
          {
            churchId,
            transactionId: String(donation.payment_transaction_id),
            status: paymentStatus,
            failureMessage:
              status === "failed"
                ? "Paiement marqué en échec par un administrateur."
                : null,
            providerResponse: {
              source: "administrator",
              changedBy: userId,
              changedAt: now,
            },
          },
          admin,
        );
      } catch (paymentError: unknown) {
        redirect(
          `/finance/donations?error=${encodeURIComponent(
            paymentErrorMessage(paymentError),
          )}`,
        );
      }
    }
  }

  revalidatePath("/finance/donations");
  redirect("/finance/donations?updated=1");
}
