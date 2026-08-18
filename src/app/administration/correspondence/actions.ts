"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { uploadChurchDocument } from "@/lib/storage/churchDocuments";
import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";

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
  if (["draft", "received", "sent", "in_review", "transmitted", "closed", "archived"].includes(status)) {
    return status;
  }
  return "received";
}

function isPastoralDecisionRole(role: string | null | undefined) {
  const normalized = normalizeRoleCode(role);
  return ["pasteur_t", "pasteur_a", "pastor", "church_admin", "admin_eglise"].includes(normalized);
}

function canValidate(role: string | null | undefined) {
  const normalized = normalizeRoleCode(role);
  return ["pasteur_t", "pastor", "church_admin", "admin_eglise"].includes(normalized);
}

async function addHistory({
  admin,
  churchId,
  correspondenceId,
  actionType,
  previousStatus,
  status,
  comment,
  createdBy,
}: {
  admin: any;
  churchId: string;
  correspondenceId: string;
  actionType: string;
  previousStatus?: string | null;
  status?: string | null;
  comment?: string | null;
  createdBy: string;
}) {
  try {
    await admin.from("admin_correspondence_history").insert({
      church_id: churchId,
      correspondence_id: correspondenceId,
      action_type: actionType,
      previous_status: previousStatus || null,
      status: status || null,
      comment: comment || null,
      created_by: createdBy,
    });
  } catch {
    // History must never block the primary correspondence action.
  }
}

async function notifyProfile({
  admin,
  churchId,
  correspondenceId,
  profileId,
  title,
  body,
  priority,
  createdBy,
}: {
  admin: any;
  churchId: string;
  correspondenceId: string;
  profileId: string | null | undefined;
  title: string;
  body?: string | null;
  priority: string;
  createdBy: string;
}) {
  if (!profileId || profileId === createdBy) return;

  try {
    await admin.from("admin_correspondence_notifications").insert({
      church_id: churchId,
      correspondence_id: correspondenceId,
      profile_id: profileId,
      title,
      body: body || null,
      priority,
      created_by: createdBy,
    });
  } catch {
    // Notification is best effort and must not block document treatment.
  }
}

async function notifySecretariat({
  admin,
  churchId,
  correspondenceId,
  reference,
  subject,
  priority,
  actorProfileId,
  actorName,
  comment,
  validated,
}: {
  admin: any;
  churchId: string;
  correspondenceId: string;
  reference: string;
  subject: string;
  priority: string;
  actorProfileId: string;
  actorName: string;
  comment: string;
  validated: boolean;
}) {
  const { data: candidates } = await admin
    .from("profiles")
    .select("id,role,status")
    .eq("church_id", churchId)
    .eq("status", "active");

  const secretaries = (candidates ?? []).filter((item: any) => {
    const role = normalizeRoleCode(item.role);
    return role === "secretaire" && item.id !== actorProfileId;
  });

  if (!secretaries.length) return;

  const title = validated
    ? `${reference} validé par ${actorName}`
    : `${reference} traité par ${actorName}`;

  const body = comment || subject;

  try {
    await admin.from("admin_correspondence_notifications").insert(
      secretaries.map((item: any) => ({
        church_id: churchId,
        correspondence_id: correspondenceId,
        profile_id: item.id,
        title,
        body,
        priority,
        created_by: actorProfileId,
      }))
    );
  } catch {
    // Notification is best effort.
  }
}

export async function createCorrespondenceAction(formData: FormData) {
  await requireAnyActionPermission(["correspondence"], "create");
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  const type = normalizeType(getString(formData.get("type")));
  const subject = getString(formData.get("subject"));
  const priority = normalizePriority(getString(formData.get("priority")));
  const status = normalizeStatus(getString(formData.get("status")));
  const correspondenceDate =
    getString(formData.get("correspondence_date")) ||
    new Date().toISOString().slice(0, 10);

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

  const assignedTo = getNullableString(formData.get("assigned_to"));

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
      assigned_to: assignedTo,
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
    .select("id,reference")
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

  await addHistory({
    admin,
    churchId: profile.church_id,
    correspondenceId: data.id,
    actionType: "created",
    status,
    comment: "Courrier enregistré.",
    createdBy: profile.id,
  });

  await notifyProfile({
    admin,
    churchId: profile.church_id,
    correspondenceId: data.id,
    profileId: assignedTo,
    title:
      priority === "urgent"
        ? `URGENT - Nouveau courrier ${data.reference}`
        : `Nouveau courrier ${data.reference}`,
    body: subject,
    priority,
    createdBy: profile.id,
  });

  revalidatePath("/administration/correspondence");
  revalidatePath("/dashboard");
  revalidatePath("/api/account/alerts");
  redirect(`/administration/correspondence/${data.id}`);
}

export async function updateCorrespondenceStatusAction(formData: FormData) {
  await requireAnyActionPermission(["correspondence"], "update");
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  const id = getString(formData.get("id"));
  const status = normalizeStatus(getString(formData.get("status")));
  const comment = getString(formData.get("comment"));
  const validationRequested = getBoolean(formData.get("validate_document"));

  if (!id) redirect("/administration/correspondence");
  if (!comment) {
    redirect(`/administration/correspondence/${id}?error=comment`);
  }

  const { data: current } = await admin
    .from("admin_correspondences")
    .select("id,reference,subject,status,priority,assigned_to,validated_at")
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .maybeSingle();

  if (!current) redirect("/administration/correspondence");

  const validationAllowed = validationRequested && canValidate(profile.role);
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status,
    updated_by: profile.id,
    updated_at: now,
  };

  if (validationAllowed) {
    updatePayload.validated_at = now;
    updatePayload.validated_by = profile.id;
  }

  const { error } = await admin
    .from("admin_correspondences")
    .update(updatePayload)
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) {
    redirect(`/administration/correspondence/${id}?error=update`);
  }

  await addHistory({
    admin,
    churchId: profile.church_id,
    correspondenceId: id,
    actionType: validationAllowed ? "validated" : "status_update",
    previousStatus: current.status,
    status,
    comment,
    createdBy: profile.id,
  });

  if (isPastoralDecisionRole(profile.role)) {
    await notifySecretariat({
      admin,
      churchId: profile.church_id,
      correspondenceId: id,
      reference: current.reference || "Courrier",
      subject: current.subject || "Courrier",
      priority: current.priority || "normal",
      actorProfileId: profile.id,
      actorName: profile.full_name || "Responsable",
      comment,
      validated: validationAllowed,
    });
  } else if (current.assigned_to && current.assigned_to !== profile.id) {
    await notifyProfile({
      admin,
      churchId: profile.church_id,
      correspondenceId: id,
      profileId: current.assigned_to,
      title:
        current.priority === "urgent"
          ? `URGENT - Mise à jour ${current.reference}`
          : `Mise à jour ${current.reference}`,
      body: comment,
      priority: current.priority || "normal",
      createdBy: profile.id,
    });
  }

  revalidatePath("/administration/correspondence");
  revalidatePath(`/administration/correspondence/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/api/account/alerts");
  redirect(`/administration/correspondence/${id}?updated=1`);
}
