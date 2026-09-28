"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

export type CheckinActionState = {
  status: "idle" | "success" | "error";
  message: string;
  pickupCode?: string;
};

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function codeHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createChildProfileAction(formData: FormData) {
  await requireAnyActionPermission(["child_checkin"], "create");
  const { admin, profile } = await requireChurchModuleAccess("child_checkin", "can_create");
  const firstName = text(formData.get("first_name")).slice(0, 100);
  const lastName = text(formData.get("last_name")).slice(0, 100);
  const guardianName = text(formData.get("guardian_name")).slice(0, 180);
  const guardianPhone = text(formData.get("guardian_phone")).slice(0, 60);
  if (!firstName || !lastName || !guardianName || !guardianPhone) redirect("/child-checkin?error=required");

  const householdId = text(formData.get("household_id")) || null;
  if (householdId) {
    const { data: household } = await admin.from("church_households").select("id").eq("church_id", profile.church_id).eq("id", householdId).maybeSingle();
    if (!household) redirect("/child-checkin?error=scope");
  }

  const { error } = await admin.from("child_profiles").insert({
    church_id: profile.church_id,
    household_id: householdId,
    first_name: firstName,
    last_name: lastName,
    birth_date: text(formData.get("birth_date")) || null,
    guardian_name: guardianName,
    guardian_phone: guardianPhone,
    allergies: text(formData.get("allergies")).slice(0, 600) || null,
    medical_notes: text(formData.get("medical_notes")).slice(0, 1000) || null,
    authorized_pickup_names: text(formData.get("authorized_pickup_names")).slice(0, 600) || null,
    created_by: profile.id,
  });
  if (error) redirect(`/child-checkin?error=${encodeURIComponent(error.code || "create")}`);
  revalidatePath("/child-checkin");
  redirect("/child-checkin?saved=child");
}

export async function checkInChildAction(
  _previous: CheckinActionState,
  formData: FormData
): Promise<CheckinActionState> {
  await requireAnyActionPermission(["child_checkin"], "update");
  const { admin, profile } = await requireChurchModuleAccess("child_checkin", "can_update");
  const childId = text(formData.get("child_id"));
  const servicePlanId = text(formData.get("service_plan_id")) || null;
  if (!childId) return { status: "error", message: "Sélectionnez un enfant." };

  const { data: child } = await admin.from("child_profiles").select("id,first_name,last_name").eq("church_id", profile.church_id).eq("id", childId).eq("status", "active").maybeSingle();
  if (!child) return { status: "error", message: "Enfant introuvable dans cette église." };
  if (servicePlanId) {
    const { data: plan } = await admin.from("service_plans").select("id").eq("church_id", profile.church_id).eq("id", servicePlanId).maybeSingle();
    if (!plan) return { status: "error", message: "Programme invalide." };
  }

  const pickupCode = String(randomInt(100000, 1000000));
  const { error } = await admin.from("child_checkins").insert({
    church_id: profile.church_id,
    child_id: child.id,
    service_plan_id: servicePlanId,
    room_name: text(formData.get("room_name")).slice(0, 100) || null,
    pickup_code_hash: codeHash(pickupCode),
    pickup_code_last4: pickupCode.slice(-4),
    status: "checked_in",
    checked_in_by: profile.id,
    notes: text(formData.get("notes")).slice(0, 600) || null,
  });
  if (error?.code === "23505") return { status: "error", message: "Cet enfant est déjà enregistré comme présent." };
  if (error) return { status: "error", message: "L’arrivée n’a pas pu être enregistrée." };

  revalidatePath("/child-checkin");
  return { status: "success", message: `${child.first_name} ${child.last_name} est enregistré(e).`, pickupCode };
}

export async function checkOutChildAction(
  _previous: CheckinActionState,
  formData: FormData
): Promise<CheckinActionState> {
  await requireAnyActionPermission(["child_checkin"], "update");
  const { admin, profile } = await requireChurchModuleAccess("child_checkin", "can_update");
  const checkinId = text(formData.get("checkin_id"));
  const pickupCode = text(formData.get("pickup_code"));
  if (!checkinId || !/^\d{6}$/.test(pickupCode)) return { status: "error", message: "Saisissez le code de retrait à 6 chiffres." };

  const { data: checkin } = await admin
    .from("child_checkins")
    .select("id,pickup_code_hash,failed_pickup_attempts,locked_at,child_profiles(first_name,last_name)")
    .eq("church_id", profile.church_id)
    .eq("id", checkinId)
    .eq("status", "checked_in")
    .maybeSingle();
  if (!checkin) return { status: "error", message: "Arrivée active introuvable." };
  if (checkin.locked_at) return { status: "error", message: "Retrait verrouillé après plusieurs erreurs. Contactez un administrateur." };

  const expected = Buffer.from(checkin.pickup_code_hash, "hex");
  const supplied = Buffer.from(codeHash(pickupCode), "hex");
  const valid = expected.length === supplied.length && timingSafeEqual(expected, supplied);
  if (!valid) {
    const attempts = Number(checkin.failed_pickup_attempts || 0) + 1;
    await admin.from("child_checkins").update({ failed_pickup_attempts: attempts, locked_at: attempts >= 5 ? new Date().toISOString() : null }).eq("church_id", profile.church_id).eq("id", checkin.id);
    return { status: "error", message: attempts >= 5 ? "Retrait verrouillé après 5 codes incorrects." : `Code incorrect. ${5 - attempts} essai(s) restant(s).` };
  }

  const { error } = await admin.from("child_checkins").update({ status: "checked_out", checked_out_at: new Date().toISOString(), checked_out_by: profile.id, updated_at: new Date().toISOString() }).eq("church_id", profile.church_id).eq("id", checkin.id);
  if (error) return { status: "error", message: "Le départ n’a pas pu être enregistré." };
  const child = Array.isArray(checkin.child_profiles) ? checkin.child_profiles[0] : checkin.child_profiles;
  revalidatePath("/child-checkin");
  return { status: "success", message: `${child?.first_name || "L’enfant"} ${child?.last_name || ""} est sorti(e) en sécurité.` };
}
