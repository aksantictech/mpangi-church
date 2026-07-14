"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
function txt(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function nullable(value: FormDataEntryValue | null) {
  const text = txt(value);
  return text || null;
}

function parseAmount(value: FormDataEntryValue | null) {
  const normalized = txt(value).replace(/\s/g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function normalizeStatus(status: string) {
  if (["draft", "active", "closed", "archived"].includes(status)) return status;
  return "active";
}

function payloadFromForm(formData: FormData) {
  return {
    title: txt(formData.get("title")),
    category_id: nullable(formData.get("category_id")),
    department_id: nullable(formData.get("department_id")),
    amount: parseAmount(formData.get("amount")),
    currency: txt(formData.get("currency")) || "CDF",
    period_start: txt(formData.get("period_start")),
    period_end: txt(formData.get("period_end")),
    status: normalizeStatus(txt(formData.get("status"))),
    notes: nullable(formData.get("notes")),
  };
}

export async function createFinanceBudgetAction(formData: FormData) {
  await requireAnyActionPermission(["budgets"], "create");
  const { admin, profile } = await requireChurchModuleAccess("budgets");
  const payload = payloadFromForm(formData);

  if (
    !payload.title ||
    !payload.period_start ||
    !payload.period_end ||
    payload.amount <= 0
  ) {
    redirect("/finance/budgets/new?error=required");
  }

  const { data, error } = await admin
    .from("finance_budgets")
    .insert({
      church_id: profile.church_id,
      ...payload,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/finance/budgets/new?error=create");
  }

  revalidatePath("/finance");
  revalidatePath("/finance/budgets");
  revalidatePath("/finance/reports");
  redirect(`/finance/budgets/${data.id}`);
}

export async function updateFinanceBudgetAction(formData: FormData) {
  await requireAnyActionPermission(["budgets"], "update");
  const { admin, profile } = await requireChurchModuleAccess("budgets");
  const id = txt(formData.get("id"));
  const payload = payloadFromForm(formData);

  if (!id) redirect("/finance/budgets");

  if (
    !payload.title ||
    !payload.period_start ||
    !payload.period_end ||
    payload.amount <= 0
  ) {
    redirect(`/finance/budgets/${id}/edit?error=required`);
  }

  const { error } = await admin
    .from("finance_budgets")
    .update({
      ...payload,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) {
    redirect(`/finance/budgets/${id}/edit?error=update`);
  }

  revalidatePath("/finance");
  revalidatePath("/finance/budgets");
  revalidatePath("/finance/reports");
  revalidatePath(`/finance/budgets/${id}`);
  redirect(`/finance/budgets/${id}`);
}

export async function archiveFinanceBudgetAction(formData: FormData) {
  await requireAnyActionPermission(["budgets"], "delete");
  const { admin, profile } = await requireChurchModuleAccess("budgets");
  const id = txt(formData.get("id"));
  const redirectTo = txt(formData.get("redirectTo")) || "/finance/budgets";

  if (!id) redirect(redirectTo);

  await admin
    .from("finance_budgets")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/finance");
  revalidatePath("/finance/budgets");
  revalidatePath("/finance/reports");
  redirect(redirectTo);
}
