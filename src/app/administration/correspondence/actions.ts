"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { uploadChurchDocument } from "@/lib/storage/churchDocuments";

function getString(value: FormDataEntryValue | null) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getNullableString(value: FormDataEntryValue | null) {
  const text = getString(value);
  return text || null;
}

function getBoolean(value: FormDataEntryValue | null) {
  return getString(value) === "on" || getString(value) === "true";
}

function getTypePrefix(type: string) {
  if (type === "incoming") return "CE";
  if (type === "outgoing") return "CS";
  if (type === "internal") return "CI";
  return "CO";
}

function generateReference(type: string) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${getTypePrefix(type)}-${y}${m}${d}-${suffix}`;
}

function normalizeType(type: string) {
  if (["incoming", "outgoing", "internal"].includes(type)) return type;
  return "incoming";
}

function normalizePriority(priority: string) {
  if (["low", "normal", "high", "urgent"].includes(priority)) return priority;
  return "normal";
}

function normalizeStatus(status: string) {
  if (["draft", "received", "sent", "in_review", "transmitted", "closed", "archived"].includes(status)) return status;
  return "received";
}

export async function createCorrespondenceAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  const type = normalizeType(getString(formData.get("type")));
  const subject = getString(formData.get("subject"));
  const priority = normalizePriority(getString(formData.get("priority")));
  const status = normalizeStatus(getString(formData.get("status")));
  const correspondenceDate = getString(formData.get("correspondence_date")) || new Date().toISOString().slice(0, 10);

  if (!subject) redirect("/administration/correspondence/new?error=subject");

  let uploadedDocument = null;
  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "correspondence",
      file: formData.get("document_file"),
    });
  } catch {
    redirect("/administration/correspondence/new?error=upload");
  }

  const { data, error } = await admin
    .from("admin_correspondences")
    .insert({
      church_id: profile.church_id,
      reference: generateReference(type),
      type,
      subject,
      sender_name: getNullableString(formData.get("sender_name")),
      sender_contact: getNullableString(formData.get("sender_contact")),
      recipient_name: getNullableString(formData.get("recipient_name")),
      recipient_contact: getNullableString(formData.get("recipient_contact")),
      department_id: getNullableString(formData.get("department_id")),
      assigned_to: getNullableString(formData.get("assigned_to")),
      priority,
      status,
      correspondence_date: correspondenceDate,
      due_date: getNullableString(formData.get("due_date")),
      confidential: getBoolean(formData.get("confidential")),
      document_url: getNullableString(formData.get("document_url")),
      document_path: uploadedDocument?.path ?? null,
      document_name: uploadedDocument?.name ?? null,
      document_mime_type: uploadedDocument?.mimeType ?? null,
      document_size: uploadedDocument?.size ?? null,
      notes: getNullableString(formData.get("notes")),
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) redirect("/administration/correspondence/new?error=create");

  if (uploadedDocument) {
    await admin.from("admin_correspondence_attachments").insert({
      church_id: profile.church_id,
      correspondence_id: data.id,
      file_name: uploadedDocument.name,
      file_url: uploadedDocument.path,
      file_path: uploadedDocument.path,
      file_type: uploadedDocument.mimeType,
      file_size: uploadedDocument.size,
      uploaded_by: profile.id,
    });
  }

  revalidatePath("/administration/correspondence");
  redirect(`/administration/correspondence/${data.id}`);
}

export async function updateCorrespondenceStatusAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("correspondence");
  const id = getString(formData.get("id"));
  const status = normalizeStatus(getString(formData.get("status")));
  if (!id) redirect("/administration/correspondence");

  await admin
    .from("admin_correspondences")
    .update({ status, updated_by: profile.id, updated_at: new Date().toISOString() })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/administration/correspondence");
  revalidatePath(`/administration/correspondence/${id}`);
}
