"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
function txt(value: FormDataEntryValue | null) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeStatus(status: string) {
  if (
    [
      "sent",
      "received",
      "read",
      "in_progress",
      "completed",
      "returned",
      "archived",
    ].includes(status)
  ) {
    return status;
  }

  return "sent";
}

function statusDates(status: string) {
  const now = new Date().toISOString();

  if (status === "completed") {
    return {
      received_at: now,
      completed_at: now,
    };
  }

  if (["received", "read", "in_progress"].includes(status)) {
    return {
      received_at: now,
    };
  }

  return {};
}

export async function updateTransmissionStatusAction(formData: FormData) {
  await requireAnyActionPermission(["transmissions","document_transmissions"], "update");
  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");

  const id = txt(formData.get("id"));
  const status = normalizeStatus(txt(formData.get("status")));
  const note = txt(formData.get("note"));

  if (!id) {
    redirect("/administration/inbox");
  }

  await admin
    .from("admin_document_transmissions")
    .update({
      status,
      ...statusDates(status),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  await admin.from("admin_document_transmission_steps").insert({
    church_id: profile.church_id,
    transmission_id: id,
    from_profile_id: profile.id,
    status,
    note: note || `Statut mis à jour : ${status}`,
    created_by: profile.id,
  });

  revalidatePath("/inbox");
  revalidatePath("/administration/inbox");
  revalidatePath("/administration/transmissions");
  revalidatePath(`/administration/transmissions/${id}`);
}

export async function archiveTransmissionAction(formData: FormData) {
  await requireAnyActionPermission(["transmissions","document_transmissions"], "delete");
  const { admin, profile } = await requireChurchModuleAccess("document_transmissions");

  const id = txt(formData.get("id"));
  const redirectTo =
    txt(formData.get("redirectTo")) ||
    txt(formData.get("redirect_to")) ||
    "/administration/inbox";

  if (!id) {
    redirect(redirectTo);
  }

  await admin
    .from("admin_document_transmissions")
    .update({
      status: "archived",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  await admin.from("admin_document_transmission_steps").insert({
    church_id: profile.church_id,
    transmission_id: id,
    from_profile_id: profile.id,
    status: "archived",
    note: "Transmission archivée.",
    created_by: profile.id,
  });

  revalidatePath("/inbox");
  revalidatePath("/administration/inbox");
  revalidatePath("/administration/transmissions");
  redirect(redirectTo);
}
