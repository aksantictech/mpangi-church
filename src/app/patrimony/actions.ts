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

function parseNumber(value: FormDataEntryValue | null) {
  const normalized = txt(value).replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return 0;
  return number;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 1) {
  const number = Math.floor(parseNumber(value));
  return number > 0 ? number : fallback;
}

function generateAssetCode() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PAT-${y}${m}${d}-${suffix}`;
}

function assetPayload(formData: FormData) {
  return {
    asset_code: txt(formData.get("asset_code")) || generateAssetCode(),
    name: txt(formData.get("name")),
    category: normalize(
      txt(formData.get("category")),
      ["building", "land", "vehicle", "sound", "it", "furniture", "instrument", "office", "security", "other"],
      "other"
    ),
    description: nullable(formData.get("description")),
    brand: nullable(formData.get("brand")),
    model: nullable(formData.get("model")),
    serial_number: nullable(formData.get("serial_number")),
    quantity: parseInteger(formData.get("quantity"), 1),
    unit: txt(formData.get("unit")) || "pièce",
    acquisition_date: nullable(formData.get("acquisition_date")),
    acquisition_value: parseNumber(formData.get("acquisition_value")) || null,
    currency: txt(formData.get("currency")) || "CDF",
    current_value: parseNumber(formData.get("current_value")) || null,
    condition: normalize(
      txt(formData.get("condition")),
      ["new", "good", "average", "damaged", "out_of_service"],
      "good"
    ),
    status: normalize(
      txt(formData.get("status")),
      ["available", "assigned", "maintenance", "lost", "sold", "archived"],
      "available"
    ),
    location: nullable(formData.get("location")),
    department_id: nullable(formData.get("department_id")),
    responsible_id: nullable(formData.get("responsible_id")),
    purchase_reference: nullable(formData.get("purchase_reference")),
    document_url: nullable(formData.get("document_url")),
  };
}

export async function createPatrimonyAssetAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "create");
  const { admin, profile } = await requireChurchModuleAccess("assets");
  const payload = assetPayload(formData);

  if (!payload.name) redirect("/patrimony/assets/new?error=required");

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "patrimony-assets",
      file: formData.get("document_file"),
    });
  } catch {
    redirect("/patrimony/assets/new?error=upload");
  }

  const { data, error } = await admin
    .from("patrimony_assets")
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

  if (error || !data) redirect("/patrimony/assets/new?error=create");

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/assets");
  redirect(`/patrimony/assets/${data.id}`);
}

export async function updatePatrimonyAssetAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "update");
  const { admin, profile } = await requireChurchModuleAccess("assets");
  const id = txt(formData.get("id"));
  const payload = assetPayload(formData);

  if (!id) redirect("/patrimony/assets");
  if (!payload.name) redirect(`/patrimony/assets/${id}/edit?error=required`);

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "patrimony-assets",
      file: formData.get("document_file"),
    });
  } catch {
    redirect(`/patrimony/assets/${id}/edit?error=upload`);
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
    .from("patrimony_assets")
    .update(updatePayload)
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (error) redirect(`/patrimony/assets/${id}/edit?error=update`);

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/assets");
  revalidatePath(`/patrimony/assets/${id}`);
  redirect(`/patrimony/assets/${id}`);
}

export async function archivePatrimonyAssetAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "delete");
  const { admin, profile } = await requireChurchModuleAccess("assets");
  const id = txt(formData.get("id"));
  const redirectTo = txt(formData.get("redirectTo")) || "/patrimony/assets";

  if (!id) redirect(redirectTo);

  await admin
    .from("patrimony_assets")
    .update({ status: "archived", updated_by: profile.id, updated_at: new Date().toISOString() })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/assets");
  redirect(redirectTo);
}

function maintenancePayload(formData: FormData) {
  return {
    asset_id: txt(formData.get("asset_id")),
    title: txt(formData.get("title")),
    description: nullable(formData.get("description")),
    maintenance_type: normalize(
      txt(formData.get("maintenance_type")),
      ["preventive", "corrective", "inspection", "repair", "other"],
      "corrective"
    ),
    provider_name: nullable(formData.get("provider_name")),
    cost: parseNumber(formData.get("cost")) || null,
    currency: txt(formData.get("currency")) || "CDF",
    status: normalize(
      txt(formData.get("status")),
      ["planned", "in_progress", "completed", "cancelled", "archived"],
      "planned"
    ),
    planned_date: nullable(formData.get("planned_date")),
    completed_date: nullable(formData.get("completed_date")),
    next_due_date: nullable(formData.get("next_due_date")),
    document_url: nullable(formData.get("document_url")),
  };
}

export async function createAssetMaintenanceAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "create");
  const { admin, profile } = await requireChurchModuleAccess("asset_maintenance");
  const payload = maintenancePayload(formData);

  if (!payload.asset_id || !payload.title) redirect("/patrimony/maintenance/new?error=required");

  let uploadedDocument = null;

  try {
    uploadedDocument = await uploadChurchDocument({
      admin,
      churchId: profile.church_id,
      module: "patrimony-maintenance",
      file: formData.get("document_file"),
    });
  } catch {
    redirect("/patrimony/maintenance/new?error=upload");
  }

  const { error } = await admin.from("patrimony_asset_maintenance").insert({
    church_id: profile.church_id,
    ...payload,
    document_path: uploadedDocument?.path ?? null,
    document_name: uploadedDocument?.name ?? null,
    document_mime_type: uploadedDocument?.mimeType ?? null,
    document_size: uploadedDocument?.size ?? null,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) redirect("/patrimony/maintenance/new?error=create");

  await admin
    .from("patrimony_assets")
    .update({ status: "maintenance", updated_by: profile.id, updated_at: new Date().toISOString() })
    .eq("church_id", profile.church_id)
    .eq("id", payload.asset_id);

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/assets");
  revalidatePath("/patrimony/maintenance");
  redirect("/patrimony/maintenance");
}

export async function updateAssetMaintenanceStatusAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "update");
  const { admin, profile } = await requireChurchModuleAccess("asset_maintenance");
  const id = txt(formData.get("id"));
  const assetId = txt(formData.get("asset_id"));
  const status = normalize(
    txt(formData.get("status")),
    ["planned", "in_progress", "completed", "cancelled", "archived"],
    "planned"
  );

  if (!id) redirect("/patrimony/maintenance");

  await admin
    .from("patrimony_asset_maintenance")
    .update({
      status,
      completed_date: status === "completed" ? new Date().toISOString().slice(0, 10) : nullable(formData.get("completed_date")),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", profile.church_id)
    .eq("id", id);

  if (assetId && status === "completed") {
    await admin
      .from("patrimony_assets")
      .update({ status: "available", updated_by: profile.id, updated_at: new Date().toISOString() })
      .eq("church_id", profile.church_id)
      .eq("id", assetId);
  }

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/maintenance");
}

function movementPayload(formData: FormData) {
  return {
    asset_id: txt(formData.get("asset_id")),
    movement_type: normalize(
      txt(formData.get("movement_type")),
      ["assignment", "transfer", "return", "loan", "loss", "sale", "disposal", "inventory_adjustment"],
      "assignment"
    ),
    movement_date: txt(formData.get("movement_date")) || new Date().toISOString().slice(0, 10),
    from_location: nullable(formData.get("from_location")),
    to_location: nullable(formData.get("to_location")),
    from_department_id: nullable(formData.get("from_department_id")),
    to_department_id: nullable(formData.get("to_department_id")),
    from_responsible_id: nullable(formData.get("from_responsible_id")),
    to_responsible_id: nullable(formData.get("to_responsible_id")),
    quantity: parseInteger(formData.get("quantity"), 1),
    reason: nullable(formData.get("reason")),
    status: normalize(txt(formData.get("status")), ["draft", "completed", "cancelled", "archived"], "completed"),
  };
}

export async function createAssetMovementAction(formData: FormData) {
  await requireAnyActionPermission(["patrimony","patrimony_dashboard","assets","maintenance","asset_maintenance","movements","asset_movements"], "create");
  const { admin, profile } = await requireChurchModuleAccess("asset_movements");
  const payload = movementPayload(formData);

  if (!payload.asset_id) redirect("/patrimony/movements/new?error=required");

  const { error } = await admin.from("patrimony_asset_movements").insert({
    church_id: profile.church_id,
    ...payload,
    created_by: profile.id,
    updated_by: profile.id,
  });

  if (error) redirect("/patrimony/movements/new?error=create");

  if (payload.status === "completed") {
    const assetStatus =
      payload.movement_type === "assignment" || payload.movement_type === "transfer" || payload.movement_type === "loan"
        ? "assigned"
        : payload.movement_type === "return"
          ? "available"
          : payload.movement_type === "loss"
            ? "lost"
            : payload.movement_type === "sale" || payload.movement_type === "disposal"
              ? "sold"
              : null;

    const assetUpdate: Record<string, any> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };

    if (payload.to_location) assetUpdate.location = payload.to_location;
    if (payload.to_department_id) assetUpdate.department_id = payload.to_department_id;
    if (payload.to_responsible_id) assetUpdate.responsible_id = payload.to_responsible_id;
    if (assetStatus) assetUpdate.status = assetStatus;

    await admin
      .from("patrimony_assets")
      .update(assetUpdate)
      .eq("church_id", profile.church_id)
      .eq("id", payload.asset_id);
  }

  revalidatePath("/patrimony");
  revalidatePath("/patrimony/assets");
  revalidatePath("/patrimony/movements");
  redirect("/patrimony/movements");
}
