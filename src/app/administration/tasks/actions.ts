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

function statusCompletedAt(status: string) {
  return status === "completed" ? new Date().toISOString() : null;
}

async function insertTaskUpdate({
  admin,
  churchId,
  taskId,
  status,
  note,
  profileId,
}: {
  admin: any;
  churchId: string | null | undefined;
  taskId: string;
  status: string;
  note: string;
  profileId: string;
}) {
  await admin.from("admin_task_updates").insert({
    church_id: churchId,
    task_id: taskId,
    status,
    note,
    created_by: profileId,
  });
}

function formPayload(formData: FormData) {
  const status = normalize(
    txt(formData.get("status")),
    ["todo", "in_progress", "waiting", "completed", "cancelled", "archived"],
    "todo"
  );

  return {
    title: txt(formData.get("title")),
    description: nullable(formData.get("description")),
    category: normalize(
      txt(formData.get("category")),
      ["general", "correspondence", "finance", "patrimony", "meeting", "followup"],
      "general"
    ),
    assigned_to: nullable(formData.get("assigned_to")),
    department_id: nullable(formData.get("department_id")),
    related_correspondence_id: nullable(formData.get("related_correspondence_id")),
    related_transmission_id: nullable(formData.get("related_transmission_id")),
    priority: normalize(
      txt(formData.get("priority")),
      ["low", "normal", "high", "urgent"],
      "normal"
    ),
    status,
    start_date: nullable(formData.get("start_date")),
    due_date: nullable(formData.get("due_date")),
    completed_at: statusCompletedAt(status),
    document_url: nullable(formData.get("document_url")),
  };
}

export async function createAdministrativeTaskAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");
  const payload = formPayload(formData);

  if (!payload.title) redirect("/administration/tasks/new?error=title");

  let uploadedDocument = null;
  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id ?? null,
      module: "tasks",
      file: formData.get("document_file"),
    });
  } catch {
    redirect("/administration/tasks/new?error=upload");
  }

  const { data, error } = await admin
    .from("admin_tasks")
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

  if (error || !data) redirect("/administration/tasks/new?error=create");

  await insertTaskUpdate({
    admin,
    churchId: profile.church_id ?? null,
    taskId: data.id,
    status: payload.status,
    note: "Tâche créée.",
    profileId: profile.id,
  });

  revalidatePath("/administration/tasks");
  redirect(`/administration/tasks/${data.id}`);
}

export async function updateAdministrativeTaskAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");
  const id = txt(formData.get("id"));
  const payload = formPayload(formData);

  if (!id) redirect("/administration/tasks");
  if (!payload.title) redirect(`/administration/tasks/${id}/edit?error=title`);

  let uploadedDocument = null;
  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id ?? null,
      module: "tasks",
      file: formData.get("document_file"),
    });
  } catch {
    redirect(`/administration/tasks/${id}/edit?error=upload`);
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
    .from("admin_tasks")
    .update(updatePayload)
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) redirect(`/administration/tasks/${id}/edit?error=update`);

  await insertTaskUpdate({
    admin,
    churchId: profile.church_id ?? null,
    taskId: id,
    status: payload.status,
    note: "Tâche modifiée.",
    profileId: profile.id,
  });

  revalidatePath("/administration/tasks");
  revalidatePath(`/administration/tasks/${id}`);
  redirect(`/administration/tasks/${id}`);
}

export async function updateAdministrativeTaskStatusAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");
  const id = txt(formData.get("id"));
  const status = normalize(
    txt(formData.get("status")),
    ["todo", "in_progress", "waiting", "completed", "cancelled", "archived"],
    "todo"
  );
  const note = nullable(formData.get("note")) || `Statut mis à jour : ${status}`;

  if (!id) redirect("/administration/tasks");

  await admin
    .from("admin_tasks")
    .update({
      status,
      completed_at: statusCompletedAt(status),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  await insertTaskUpdate({
    admin,
    churchId: profile.church_id ?? null,
    taskId: id,
    status,
    note,
    profileId: profile.id,
  });

  revalidatePath("/administration/tasks");
  revalidatePath(`/administration/tasks/${id}`);
}

export async function archiveAdministrativeTaskAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("administrative_tasks");
  const id = txt(formData.get("id"));
  const redirectTo = txt(formData.get("redirectTo")) || "/administration/tasks";

  if (!id) redirect(redirectTo);

  await admin
    .from("admin_tasks")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  await insertTaskUpdate({
    admin,
    churchId: profile.church_id ?? null,
    taskId: id,
    status: "archived",
    note: "Tâche archivée.",
    profileId: profile.id,
  });

  revalidatePath("/administration/tasks");
  revalidatePath(`/administration/tasks/${id}`);
  redirect(redirectTo);
}
