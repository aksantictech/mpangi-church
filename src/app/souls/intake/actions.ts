"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

function text(formData: FormData, key: string, max = 300) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function createSoulIntakeAction(formData: FormData) {
  const { admin, profile } = await requireChurchModuleAccess("souls", "can_create");

  const lastName = text(formData, "last_name", 120);
  const middleName = text(formData, "middle_name", 120);
  const firstName = text(formData, "first_name", 120);
  const receptionDate = text(formData, "reception_date", 10);
  const serviceType = text(formData, "service_type", 30);
  const gender = text(formData, "gender", 20);
  const maritalStatus = text(formData, "marital_status", 30);
  const ageRange = text(formData, "age_range", 20);
  const residenceAddress = text(formData, "residence_address", 300);
  const city = text(formData, "city", 120);
  const country = text(formData, "country", 120);
  const whatsappPhone = text(formData, "whatsapp_phone", 60);
  const otherPhone = text(formData, "other_phone", 60);
  const arrivalChannel = text(formData, "arrival_channel", 40);
  const assignedProfileId = text(formData, "assigned_profile_id", 80);
  const comment = text(formData, "comment", 3000);
  const attendsOtherChurch = bool(formData, "attends_other_church");
  const isNewcomer = bool(formData, "is_newcomer");
  const isNewConvert = bool(formData, "is_new_convert");

  if (
    !lastName ||
    !firstName ||
    !/^\d{4}-\d{2}-\d{2}$/.test(receptionDate) ||
    !["dimanche", "semaine"].includes(serviceType) ||
    !["homme", "femme"].includes(gender) ||
    !["marie", "celibataire", "veuf", "veuve", "en_couple"].includes(maritalStatus) ||
    !["0_12", "13_17", "18_25", "26_35", "36_45", "46_60", "60_plus"].includes(ageRange) ||
    !residenceAddress ||
    !city ||
    !country ||
    !whatsappPhone ||
    !["amis", "evangelisation", "flyers", "reseaux_sociaux", "autre"].includes(arrivalChannel) ||
    (!isNewcomer && !isNewConvert) ||
    !assignedProfileId
  ) {
    redirect("/souls/intake/new?error=invalid");
  }

  const { data: assignee } = await admin
    .from("profiles")
    .select("id,full_name,status,church_id")
    .eq("id", assignedProfileId)
    .eq("church_id", profile.church_id)
    .eq("status", "active")
    .maybeSingle();

  if (!assignee) {
    redirect("/souls/intake/new?error=assignee");
  }

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const typeLabel = isNewcomer && isNewConvert
    ? "Nouveau venu et nouveau converti"
    : isNewConvert
      ? "Nouveau converti"
      : "Nouveau venu";

  const { data: intake, error: intakeError } = await admin
    .from("soul_intakes")
    .insert({
      church_id: profile.church_id,
      last_name: lastName,
      middle_name: middleName || null,
      first_name: firstName,
      reception_date: receptionDate,
      service_type: serviceType,
      gender,
      marital_status: maritalStatus,
      age_range: ageRange,
      residence_address: residenceAddress,
      city,
      country,
      whatsapp_phone: whatsappPhone,
      other_phone: otherPhone || null,
      arrival_channel: arrivalChannel,
      attends_other_church: attendsOtherChurch,
      is_newcomer: isNewcomer,
      is_new_convert: isNewConvert,
      comment: comment || null,
      assigned_profile_id: assignee.id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (intakeError || !intake) {
    console.error("Création accueil âme impossible", intakeError?.message);
    redirect("/souls/intake/new?error=save");
  }

  const due = new Date(`${receptionDate}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 7);
  const dueDate = due.toISOString().slice(0, 10);

  const notes = [
    `Type : ${typeLabel}`,
    `Culte : ${serviceType}`,
    `Canal : ${arrivalChannel}`,
    `Résidence : ${residenceAddress}, ${city}, ${country}`,
    `Autre église : ${attendsOtherChurch ? "Oui" : "Non"}`,
    comment ? `Commentaire : ${comment}` : "",
  ].filter(Boolean).join("\n");

  const { data: followup, error: followupError } = await admin
    .from("soul_followups")
    .insert({
      church_id: profile.church_id,
      intake_id: intake.id,
      full_name: fullName,
      phone: whatsappPhone,
      source: "accueil_ames",
      need_type: isNewConvert ? "integration" : "accompagnement",
      priority: "normale",
      status: "nouveau",
      first_contact_date: receptionDate,
      last_contact_date: receptionDate,
      next_followup_date: dueDate,
      assigned_to: assignee.id,
      created_by: profile.id,
      notes,
    })
    .select("id")
    .single();

  if (followupError || !followup) {
    await admin.from("soul_intakes").delete().eq("id", intake.id).eq("church_id", profile.church_id);
    console.error("Création suivi âme impossible", followupError?.message);
    redirect("/souls/intake/new?error=followup");
  }

  await admin
    .from("soul_intakes")
    .update({ linked_followup_id: followup.id, updated_at: new Date().toISOString() })
    .eq("id", intake.id)
    .eq("church_id", profile.church_id);

  // La cloche interne compte les tâches administratives affectées au profil.
  // Le responsable sélectionné reçoit donc immédiatement un élément de suivi.
  await admin.from("admin_tasks").insert({
    church_id: profile.church_id,
    title: `Suivi d’âme — ${fullName}`,
    description: `${typeLabel}. Premier suivi attendu avant le ${dueDate}.`,
    category: "followup",
    assigned_to: assignee.id,
    priority: "normal",
    status: "todo",
    start_date: receptionDate,
    due_date: dueDate,
    created_by: profile.id,
    updated_by: profile.id,
  });

  revalidatePath("/souls");
  revalidatePath("/souls/intake");
  revalidatePath("/dashboard");
  redirect("/souls/intake?created=1");
}
