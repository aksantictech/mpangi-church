"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function optional(value: FormDataEntryValue | null) {
  return text(value) || null;
}

function amount(value: FormDataEntryValue | null) {
  const parsed = Number(text(value).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0;
}

export async function createCampaignAction(formData: FormData) {
  await requireAnyActionPermission(["giving_campaigns"], "create");
  const { admin, profile } = await requireChurchModuleAccess("giving_campaigns", "can_create");
  const name = text(formData.get("name")).slice(0, 140);
  const targetAmount = amount(formData.get("target_amount"));
  const currency = text(formData.get("currency")).toUpperCase().slice(0, 8) || "CDF";

  if (!name || !targetAmount) redirect("/finance/campaigns?error=campaign");

  const { error } = await admin.from("giving_campaigns").insert({
    church_id: profile.church_id,
    name,
    description: optional(formData.get("description"))?.slice(0, 1200),
    target_amount: targetAmount,
    currency,
    starts_on: optional(formData.get("starts_on")),
    ends_on: optional(formData.get("ends_on")),
    status: text(formData.get("status")) === "active" ? "active" : "draft",
    public_enabled: formData.get("public_enabled") === "on",
    created_by: profile.id,
  });

  if (error) redirect(`/finance/campaigns?error=${encodeURIComponent(error.code || "create")}`);
  revalidatePath("/finance/campaigns");
  redirect("/finance/campaigns?saved=campaign");
}

export async function createPledgeAction(formData: FormData) {
  await requireAnyActionPermission(["giving_campaigns"], "create");
  const { admin, profile } = await requireChurchModuleAccess("giving_campaigns", "can_create");
  const campaignId = text(formData.get("campaign_id"));
  const donorName = text(formData.get("donor_name")).slice(0, 180);
  const pledgedAmount = amount(formData.get("pledged_amount"));
  const frequency = text(formData.get("frequency"));

  const { data: campaign } = await admin.from("giving_campaigns")
    .select("id,currency")
    .eq("church_id", profile.church_id)
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign || !donorName || !pledgedAmount) redirect("/finance/campaigns?error=pledge");

  const { error } = await admin.from("giving_pledges").insert({
    church_id: profile.church_id,
    campaign_id: campaign.id,
    donor_name: donorName,
    donor_email: optional(formData.get("donor_email"))?.slice(0, 180),
    donor_phone: optional(formData.get("donor_phone"))?.slice(0, 60),
    pledged_amount: pledgedAmount,
    currency: campaign.currency,
    frequency: ["one_time", "monthly", "quarterly"].includes(frequency) ? frequency : "one_time",
    due_date: optional(formData.get("due_date")),
    notes: optional(formData.get("notes"))?.slice(0, 1000),
    created_by: profile.id,
  });

  if (error) redirect(`/finance/campaigns?error=${encodeURIComponent(error.code || "pledge")}`);
  revalidatePath("/finance/campaigns");
  redirect("/finance/campaigns?saved=pledge");
}

export async function recordPledgePaymentAction(formData: FormData) {
  await requireAnyActionPermission(["giving_campaigns"], "update");
  const { admin, profile } = await requireChurchModuleAccess("giving_campaigns", "can_update");
  const pledgeId = text(formData.get("pledge_id"));
  const paidAmount = amount(formData.get("amount"));

  const { data: pledge } = await admin.from("giving_pledges")
    .select("id")
    .eq("church_id", profile.church_id)
    .eq("id", pledgeId)
    .maybeSingle();

  if (!pledge || !paidAmount) redirect("/finance/campaigns?error=payment");

  const { error } = await admin.from("giving_pledge_payments").insert({
    church_id: profile.church_id,
    pledge_id: pledge.id,
    amount: paidAmount,
    paid_on: optional(formData.get("paid_on")) || new Date().toISOString().slice(0, 10),
    method: text(formData.get("method")).slice(0, 40) || "cash",
    reference: optional(formData.get("reference"))?.slice(0, 120),
    notes: optional(formData.get("notes"))?.slice(0, 600),
    created_by: profile.id,
  });

  if (error) redirect(`/finance/campaigns?error=${encodeURIComponent(error.code || "payment")}`);
  revalidatePath("/finance/campaigns");
  redirect("/finance/campaigns?saved=payment");
}
