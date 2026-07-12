"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/security/access";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function numberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "0").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export async function createExtensionAction(formData: FormData) {
  const { admin, churchId } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const name = text(formData, "name");

  if (!name) {
    throw new Error("Le nom de l'extension est obligatoire.");
  }

  const { error } = await admin.from("church_extensions").insert({
    church_id: churchId,
    name,
    code: text(formData, "code") || null,
    address: text(formData, "address") || null,
    city: text(formData, "city") || null,
    responsible_name: text(formData, "responsible_name") || null,
    responsible_phone: text(formData, "responsible_phone") || null,
    notes: text(formData, "notes") || null,
    status: text(formData, "status") || "active",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/extensions");
  redirect("/extensions");
}

export async function updateExtensionAction(formData: FormData) {
  const { admin, churchId } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const id = text(formData, "id");
  const name = text(formData, "name");

  if (!id) throw new Error("Extension introuvable.");
  if (!name) throw new Error("Le nom de l'extension est obligatoire.");

  const { error } = await admin
    .from("church_extensions")
    .update({
      name,
      code: text(formData, "code") || null,
      address: text(formData, "address") || null,
      city: text(formData, "city") || null,
      responsible_name: text(formData, "responsible_name") || null,
      responsible_phone: text(formData, "responsible_phone") || null,
      notes: text(formData, "notes") || null,
      status: text(formData, "status") || "active",
    })
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw new Error(error.message);

  revalidatePath("/extensions");
  redirect("/extensions");
}

export async function createExtensionActivityAction(formData: FormData) {
  const { admin, churchId, profile } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const extensionId = text(formData, "extension_id");
  const weekStart = text(formData, "week_start");
  const weekEnd = text(formData, "week_end");
  const activityDate = text(formData, "activity_date");
  const activityType = text(formData, "activity_type");

  if (!extensionId) throw new Error("L'extension est obligatoire.");
  if (!weekStart || !weekEnd) throw new Error("La semaine est obligatoire.");
  if (!activityDate) throw new Error("La date de l'activité est obligatoire.");
  if (!activityType) throw new Error("Le type d'activité est obligatoire.");

  const { error } = await admin.from("extension_weekly_activities").insert({
    church_id: churchId,
    extension_id: extensionId,
    week_start: weekStart,
    week_end: weekEnd,
    activity_date: activityDate,
    activity_type: activityType,
    men_count: numberValue(formData, "men_count"),
    women_count: numberValue(formData, "women_count"),
    children_count: numberValue(formData, "children_count"),
    new_converts_count: numberValue(formData, "new_converts_count"),
    new_visitors_count: numberValue(formData, "new_visitors_count"),
    income_amount: numberValue(formData, "income_amount"),
    expense_amount: numberValue(formData, "expense_amount"),
    currency: text(formData, "currency") || "CDF",
    summary: text(formData, "summary") || null,
    needs: text(formData, "needs") || null,
    status: text(formData, "status") || "submitted",
    submitted_by: profile?.id || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/extensions/activities");
  revalidatePath("/extensions/reports");
  redirect("/extensions/activities");
}

export async function validateExtensionActivityAction(formData: FormData) {
  const { admin, churchId, profile } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const id = text(formData, "id");
  if (!id) throw new Error("Activité introuvable.");

  const { error } = await admin
    .from("extension_weekly_activities")
    .update({
      status: "validated",
      validated_by: profile?.id || null,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw new Error(error.message);

  revalidatePath("/extensions/activities");
  revalidatePath("/extensions/reports");
}
