"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { uploadChurchDocument } from "@/lib/storage/churchDocuments";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
function txt(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function nullable(value: FormDataEntryValue | null) {
  const text = txt(value);
  return text || null;
}

function normalize(value: string, allowed: string[], fallback: string) {
  return allowed.includes(value) ? value : fallback;
}

function parseAmount(value: FormDataEntryValue | null) {
  const normalized = txt(value).replace(/\s/g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function computeAmountCdf(amount: number, currency: string, exchangeRate: number | null) {
  if (currency === "CDF") return amount;
  if (exchangeRate && exchangeRate > 0) return amount * exchangeRate;
  return null;
}

function transactionModule(transactionType: string) {
  return transactionType === "expense" ? "expenses" : "offerings";
}

function transactionRedirect(transactionType: string) {
  return transactionType === "expense" ? "/finance/expenses" : "/finance/offerings";
}

function payloadFromForm(formData: FormData, forcedType?: "income" | "expense") {
  const transactionType = forcedType || normalize(
    txt(formData.get("transaction_type")),
    ["income", "expense"],
    "income"
  ) as "income" | "expense";

  const amount = parseAmount(formData.get("amount"));
  const currency = txt(formData.get("currency")) || "CDF";
  const exchangeRateRaw = parseAmount(formData.get("exchange_rate"));
  const exchangeRate = exchangeRateRaw > 0 ? exchangeRateRaw : null;

  return {
    transaction_type: transactionType,
    category_id: nullable(formData.get("category_id")),
    title: txt(formData.get("title")),
    description: nullable(formData.get("description")),
    amount,
    currency,
    exchange_rate: exchangeRate,
    amount_cdf: computeAmountCdf(amount, currency, exchangeRate),
    transaction_date: txt(formData.get("transaction_date")) || new Date().toISOString().slice(0, 10),
    payment_method: normalize(
      txt(formData.get("payment_method")),
      ["cash", "mobile_money", "bank_transfer", "card", "cheque", "other"],
      "cash"
    ),
    reference: nullable(formData.get("reference")),
    payer_name: nullable(formData.get("payer_name")),
    payee_name: nullable(formData.get("payee_name")),
    department_id: nullable(formData.get("department_id")),
    related_task_id: nullable(formData.get("related_task_id")),
    status: normalize(
      txt(formData.get("status")),
      ["draft", "recorded", "pending_approval", "approved", "rejected", "cancelled", "archived"],
      "recorded"
    ),
    document_url: nullable(formData.get("document_url")),
  };
}

export async function createFinanceTransactionAction(formData: FormData) {
  await requireAnyActionPermission(["finance_dashboard","offerings","expenses","budgets"], "create");
  const forcedType = normalize(
    txt(formData.get("transaction_type")),
    ["income", "expense"],
    "income"
  ) as "income" | "expense";

  const moduleCode = forcedType === "expense" ? "expenses" : "offerings";
  const { admin, profile } = await requireChurchModuleAccess(moduleCode);
  const payload = payloadFromForm(formData, forcedType);

  if (!payload.title || payload.amount <= 0) {
    redirect(`${transactionRedirect(payload.transaction_type)}/new?error=required`);
  }

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: transactionModule(payload.transaction_type),
      file: formData.get("document_file"),
    });
  } catch {
    redirect(`${transactionRedirect(payload.transaction_type)}/new?error=upload`);
  }

  const approvedFields =
    payload.status === "approved"
      ? { approved_by: profile.id, approved_at: new Date().toISOString() }
      : {};

  const { data, error } = await admin
    .from("finance_transactions")
    .insert({
      church_id: profile.church_id,
      ...payload,
      ...approvedFields,
      document_path: uploadedDocument?.path ?? null,
      document_name: uploadedDocument?.name ?? null,
      document_mime_type: uploadedDocument?.mimeType ?? null,
      document_size: uploadedDocument?.size ?? null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`${transactionRedirect(payload.transaction_type)}/new?error=create`);
  }

  revalidatePath("/finance");
  revalidatePath("/finance/offerings");
  revalidatePath("/finance/expenses");
  redirect(`${transactionRedirect(payload.transaction_type)}/${data.id}`);
}

export async function updateFinanceTransactionStatusAction(formData: FormData) {
  await requireAnyActionPermission(["finance_dashboard","offerings","expenses","budgets"], "update");
  const transactionType = normalize(
    txt(formData.get("transaction_type")),
    ["income", "expense"],
    "income"
  );
  const moduleCode = transactionType === "expense" ? "expenses" : "offerings";
  const { admin, profile } = await requireChurchModuleAccess(moduleCode);

  const id = txt(formData.get("id"));
  const status = normalize(
    txt(formData.get("status")),
    ["draft", "recorded", "pending_approval", "approved", "rejected", "cancelled", "archived"],
    "recorded"
  );

  if (!id) {
    redirect(transactionRedirect(transactionType));
  }

  const approvedFields =
    status === "approved"
      ? { approved_by: profile.id, approved_at: new Date().toISOString() }
      : {};

  await admin
    .from("finance_transactions")
    .update({
      status,
      ...approvedFields,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/finance");
  revalidatePath("/finance/offerings");
  revalidatePath("/finance/expenses");
  revalidatePath(`${transactionRedirect(transactionType)}/${id}`);
}

export async function archiveFinanceTransactionAction(formData: FormData) {
  await requireAnyActionPermission(["finance_dashboard","offerings","expenses","budgets"], "delete");
  const transactionType = normalize(
    txt(formData.get("transaction_type")),
    ["income", "expense"],
    "income"
  );
  const moduleCode = transactionType === "expense" ? "expenses" : "offerings";
  const { admin, profile } = await requireChurchModuleAccess(moduleCode);

  const id = txt(formData.get("id"));
  const redirectTo = txt(formData.get("redirectTo")) || transactionRedirect(transactionType);

  if (!id) redirect(redirectTo);

  await admin
    .from("finance_transactions")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/finance");
  revalidatePath("/finance/offerings");
  revalidatePath("/finance/expenses");
  redirect(redirectTo);
}
