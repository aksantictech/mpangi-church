"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) { return String(value || "").trim(); }
function optional(value: FormDataEntryValue | null) { return text(value) || null; }

type FieldDefinition = { key: string; label: string; type: "text" | "email" | "tel" | "textarea" | "date" | "number" | "select"; required: boolean; options?: string[] };

function parseFields(raw: string): FieldDefinition[] {
  const types = new Set(["text", "email", "tel", "textarea", "date", "number", "select"]);
  return raw.split(/\r?\n/).map((line, index) => {
    const [labelRaw, typeRaw, requiredRaw, optionsRaw] = line.split("|").map((part) => part.trim());
    const label = labelRaw?.slice(0, 100);
    if (!label) return null;
    const type = (types.has(typeRaw) ? typeRaw : "text") as FieldDefinition["type"];
    const options = type === "select" ? (optionsRaw || "").split(",").map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 20) : undefined;
    return { key: `field_${index + 1}`, label, type, required: ["required", "obligatoire", "oui", "yes"].includes((requiredRaw || "").toLowerCase()), ...(options?.length ? { options } : {}) };
  }).filter((field): field is FieldDefinition => Boolean(field)).slice(0, 30);
}

export async function createChurchFormAction(formData: FormData) {
  await requireAnyActionPermission(["custom_forms"], "create");
  const { admin, profile } = await requireChurchModuleAccess("custom_forms", "can_create");
  const title = text(formData.get("title")).slice(0, 160);
  const fields = parseFields(text(formData.get("fields_definition")));
  const formType = text(formData.get("form_type"));
  if (!title || fields.length === 0) redirect("/forms?error=form");

  const publish = formData.get("publish") === "on";
  const { error } = await admin.from("church_forms").insert({
    church_id: profile.church_id,
    title,
    description: optional(formData.get("description"))?.slice(0, 1500),
    form_type: ["general", "event", "group", "volunteer", "counseling"].includes(formType) ? formType : "general",
    fields,
    confirmation_message: text(formData.get("confirmation_message")).slice(0, 500) || "Merci, votre réponse a bien été enregistrée.",
    status: publish ? "published" : "draft",
    public_enabled: publish,
    created_by: profile.id,
  });
  if (error) redirect(`/forms?error=${encodeURIComponent(error.code || "create")}`);
  revalidatePath("/forms");
  redirect("/forms?saved=form");
}

export async function updateFormStatusAction(formData: FormData) {
  await requireAnyActionPermission(["custom_forms"], "update");
  const { admin, profile } = await requireChurchModuleAccess("custom_forms", "can_update");
  const formId = text(formData.get("form_id"));
  const status = text(formData.get("status"));
  if (!formId || !["draft", "published", "closed"].includes(status)) redirect("/forms?error=status");
  const { error } = await admin.from("church_forms").update({ status, public_enabled: status === "published" }).eq("church_id", profile.church_id).eq("id", formId);
  if (error) redirect(`/forms?error=${encodeURIComponent(error.code || "status")}`);
  revalidatePath("/forms");
  redirect("/forms?saved=status");
}

export async function updateSubmissionStatusAction(formData: FormData) {
  await requireAnyActionPermission(["custom_forms"], "update");
  const { admin, profile } = await requireChurchModuleAccess("custom_forms", "can_update");
  const submissionId = text(formData.get("submission_id"));
  const status = text(formData.get("status"));
  if (!submissionId || !["new", "reviewing", "approved", "rejected", "archived"].includes(status)) redirect("/forms?error=submission");
  const reviewed = ["approved", "rejected", "archived"].includes(status);
  const { error } = await admin.from("church_form_submissions").update({ status, reviewed_at: reviewed ? new Date().toISOString() : null, reviewed_by: reviewed ? profile.id : null }).eq("church_id", profile.church_id).eq("id", submissionId);
  if (error) redirect(`/forms?error=${encodeURIComponent(error.code || "submission")}`);
  revalidatePath("/forms");
  redirect("/forms?saved=submission");
}
