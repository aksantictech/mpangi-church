"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { uploadChurchDocument } from "@/lib/storage/churchDocuments";

function getString(value: FormDataEntryValue | null) { return value === null || value === undefined ? "" : String(value).trim(); }
function getNullableString(value: FormDataEntryValue | null) { const text = getString(value); return text || null; }
function normalizePriority(priority: string) { return ["low","normal","high","urgent"].includes(priority) ? priority : "normal"; }
function normalizeStatus(status: string) { return ["sent","received","read","in_progress","completed","returned","archived"].includes(status) ? status : "sent"; }
function generateReference() { const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); const suffix=Math.random().toString(36).slice(2,7).toUpperCase(); return `TD-${y}${m}${day}-${suffix}`; }

export async function createTransmissionAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");
  const title = getString(formData.get("title"));
  const priority = normalizePriority(getString(formData.get("priority")));
  if (!title) redirect("/administration/transmissions/new?error=title");

  const recipientProfileId = getNullableString(formData.get("recipient_profile_id"));
  const recipientDepartmentId = getNullableString(formData.get("recipient_department_id"));
  if (!recipientProfileId && !recipientDepartmentId) redirect("/administration/transmissions/new?error=recipient");

  let uploadedDocument = null;
  try {
    uploadedDocument = await uploadChurchDocument({ admin, churchId: profile.church_id, module: "transmissions", file: formData.get("document_file") });
  } catch {
    redirect("/administration/transmissions/new?error=upload");
  }

  const { data, error } = await admin.from("admin_document_transmissions").insert({
    church_id: profile.church_id,
    reference: generateReference(),
    correspondence_id: getNullableString(formData.get("correspondence_id")),
    title,
    document_url: getNullableString(formData.get("document_url")),
    document_path: uploadedDocument?.path ?? null,
    document_name: uploadedDocument?.name ?? null,
    document_mime_type: uploadedDocument?.mimeType ?? null,
    document_size: uploadedDocument?.size ?? null,
    sender_profile_id: profile.id,
    recipient_profile_id: recipientProfileId,
    recipient_department_id: recipientDepartmentId,
    priority,
    status: "sent",
    instructions: getNullableString(formData.get("instructions")),
    due_date: getNullableString(formData.get("due_date")),
    created_by: profile.id,
    updated_by: profile.id,
  }).select("id").single();

  if (error || !data) redirect("/administration/transmissions/new?error=create");

  await admin.from("admin_document_transmission_steps").insert({
    church_id: profile.church_id,
    transmission_id: data.id,
    from_profile_id: profile.id,
    to_profile_id: recipientProfileId,
    to_department_id: recipientDepartmentId,
    status: "sent",
    note: "Transmission créée et envoyée.",
    created_by: profile.id,
  });

  revalidatePath("/administration/transmissions");
  redirect(`/administration/transmissions/${data.id}`);
}

export async function updateTransmissionStatusAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");
  const id = getString(formData.get("id"));
  const status = normalizeStatus(getString(formData.get("status")));
  const note = getNullableString(formData.get("note"));
  if (!id) redirect("/administration/transmissions");

  const statusDates: Record<string, string | null> = {};
  if (status === "received" || status === "read" || status === "in_progress") statusDates.received_at = new Date().toISOString();
  if (status === "completed") statusDates.completed_at = new Date().toISOString();

  await admin.from("admin_document_transmissions").update({ status, ...statusDates, updated_by: profile.id, updated_at: new Date().toISOString() }).eq("church_id", profile.church_id).eq("id", id);
  await admin.from("admin_document_transmission_steps").insert({ church_id: profile.church_id, transmission_id: id, from_profile_id: profile.id, status, note: note || `Statut mis à jour : ${status}`, created_by: profile.id });

  revalidatePath("/administration/transmissions");
  revalidatePath(`/administration/transmissions/${id}`);
}
