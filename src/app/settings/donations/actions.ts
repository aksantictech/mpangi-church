"use server";

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

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

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
    redirect("/unauthorized?reason=donation_settings");
  }

  return {
    admin,
    churchId: String(profile.church_id),
  };
}

export async function updateDonationSettingsAction(
  formData: FormData
) {
  await requireAnyActionPermission(["settings","donations"], "update");
  const { admin, churchId } = await getContext();

  const currencies = value(formData, "allowed_currencies")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);

  const defaultCurrency =
    value(formData, "default_currency").toUpperCase() ||
    currencies[0] ||
    "CDF";

  const payload = {
    donation_enabled: formData.get("donation_enabled") === "on",
    donation_message: value(formData, "donation_message") || null,
    donation_default_currency: defaultCurrency,
    donation_allowed_currencies:
      currencies.length > 0 ? currencies : [defaultCurrency],
    donation_min_amount: Number(
      value(formData, "donation_min_amount") || "1"
    ),
    donation_mobile_money:
      value(formData, "donation_mobile_money") || null,
    donation_mobile_money_name:
      value(formData, "donation_mobile_money_name") || null,
    donation_card_url:
      value(formData, "donation_card_url") || null,
    donation_card_provider_name:
      value(formData, "donation_card_provider_name") || null,
    donation_bank_name:
      value(formData, "donation_bank_name") || null,
    donation_bank_account_name:
      value(formData, "donation_bank_account_name") || null,
    donation_bank_account_number:
      value(formData, "donation_bank_account_number") || null,
    donation_bank_iban:
      value(formData, "donation_bank_iban") || null,
    donation_bank_swift:
      value(formData, "donation_bank_swift") || null,
    donation_bank_details:
      value(formData, "donation_bank_details") || null,
    donation_cash_enabled:
      formData.get("donation_cash_enabled") === "on",
    donation_receipt_email:
      value(formData, "donation_receipt_email") || null,
  };

  const { error } = await admin
    .from("churches")
    .update(payload)
    .eq("id", churchId);

  if (error) {
    redirect(
      `/settings/donations?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/settings/donations?saved=1");
}
