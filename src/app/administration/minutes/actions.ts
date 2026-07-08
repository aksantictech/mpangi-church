"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { uploadChurchDocument } from "@/lib/storage/churchDocuments";

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

function payloadFromForm(formData: FormData) {
  return {
    title: txt(formData.get("title")),
    meeting_type: normalize(
      txt(formData.get("meeting_type")),
      ["general", "pastoral", "administration", "finance", "patrimony", "department", "project"],
      "administration"
    ),
    meeting_date: txt(formData.get("meeting_date")) || new Date().toISOString().slice(0, 10),
    start_time: nullable(formData.get("start_time")),
    end_time: nullable(formData.get("end_time")),
    location: nullable(formData.get("location")),
    status: normalize(
      txt(formData.get("status")),
      ["planned", "ongoing", "completed", "cancelled", "archived"],
      "planned"
    ),
    chaired_by: nullable(formData.get("chaired_by")),
    secretary_id: nullable(formData.get("secretary_id")),
    department_id: nullable(formData.get("department_id")),
    agenda: nullable(formData.get("agenda")),
    participants_notes: nullable(formData.get("participants_notes")),
    minutes: nullable(formData.get("minutes")),
    decisions_summary: nullable(formData.get("decisions_summary")),
    followup_notes: nullable(formData.get("followup_notes")),
    document_url: nullable(formData.get("document_url")),
  };
}

export async function createMeetingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");
  const payload = payloadFromForm(formData);

  if (!payload.title) {
    redirect("/administration/minutes/new?error=title");
  }

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "meetings",
      file: formData.get("document_file"),
    });
  } catch {
    redirect("/administration/minutes/new?error=upload");
  }

  const { data, error } = await admin
    .from("admin_meetings")
    .insert({
      church_id: profile.church_id,
      ...payload,
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
    redirect("/administration/minutes/new?error=create");
  }

  revalidatePath("/administration/minutes");
  redirect(`/administration/minutes/${data.id}`);
}

export async function updateMeetingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");
  const id = txt(formData.get("id"));
  const payload = payloadFromForm(formData);

  if (!id) {
    redirect("/administration/minutes");
  }

  if (!payload.title) {
    redirect(`/administration/minutes/${id}/edit?error=title`);
  }

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "meetings",
      file: formData.get("document_file"),
    });
  } catch {
    redirect(`/administration/minutes/${id}/edit?error=upload`);
  }

  const updatePayload: Record<string, any> = {
    ...payload,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  };

  if (uploadedDocument) {
    updatePayload.document_path = uploadedDocument.path;
    updatePayload.document_name = uploadedDocument.name;
    updatePayload.document_mime_type = uploadedDocument.mimeType;
    updatePayload.document_size = uploadedDocument.size;
  }

  const { error } = await admin
    .from("admin_meetings")
    .update(updatePayload)
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) {
    redirect(`/administration/minutes/${id}/edit?error=update`);
  }

  revalidatePath("/administration/minutes");
  revalidatePath(`/administration/minutes/${id}`);
  redirect(`/administration/minutes/${id}`);
}

export async function updateMeetingStatusAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");
  const id = txt(formData.get("id"));
  const status = normalize(
    txt(formData.get("status")),
    ["planned", "ongoing", "completed", "cancelled", "archived"],
    "planned"
  );

  if (!id) {
    redirect("/administration/minutes");
  }

  await admin
    .from("admin_meetings")
    .update({
      status,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/administration/minutes");
  revalidatePath(`/administration/minutes/${id}`);
}

export async function archiveMeetingAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("meetings_minutes");
  const id = txt(formData.get("id"));
  const redirectTo = txt(formData.get("redirectTo")) || "/administration/minutes";

  if (!id) {
    redirect(redirectTo);
  }

  await admin
    .from("admin_meetings")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/administration/minutes");
  revalidatePath(`/administration/minutes/${id}`);
  redirect(redirectTo);
}
