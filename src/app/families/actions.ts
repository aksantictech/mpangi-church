"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function createHouseholdAction(formData: FormData) {
  await requireAnyActionPermission(["families"], "create");
  const { admin, profile } = await requireChurchModuleAccess("families", "can_create");
  const name = text(formData.get("name")).slice(0, 140);
  const primaryMemberId = text(formData.get("primary_member_id"));

  if (!name || !primaryMemberId) redirect("/families?error=required");

  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("church_id", profile.church_id)
    .eq("id", primaryMemberId)
    .maybeSingle();
  if (!member) redirect("/families?error=scope");

  const { data: household, error } = await admin
    .from("church_households")
    .insert({
      church_id: profile.church_id,
      name,
      primary_member_id: primaryMemberId,
      address: text(formData.get("address")).slice(0, 240) || null,
      city: text(formData.get("city")).slice(0, 120) || null,
      notes: text(formData.get("notes")).slice(0, 1200) || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !household) redirect(`/families?error=${encodeURIComponent(error?.code || "create")}`);

  const { error: memberError } = await admin.from("household_members").insert({
    church_id: profile.church_id,
    household_id: household.id,
    member_id: primaryMemberId,
    relationship: "head",
    is_primary_contact: true,
    created_by: profile.id,
  });

  if (memberError) {
    await admin.from("church_households").delete().eq("church_id", profile.church_id).eq("id", household.id);
    redirect(`/families?error=${encodeURIComponent(memberError.code || "member")}`);
  }

  revalidatePath("/families");
  redirect("/families?saved=household");
}

export async function addHouseholdMemberAction(formData: FormData) {
  await requireAnyActionPermission(["families"], "update");
  const { admin, profile } = await requireChurchModuleAccess("families", "can_update");
  const householdId = text(formData.get("household_id"));
  const memberId = text(formData.get("member_id"));
  const relationship = text(formData.get("relationship"));

  if (!householdId || !memberId) redirect("/families?error=member");
  const [{ data: household }, { data: member }] = await Promise.all([
    admin.from("church_households").select("id").eq("church_id", profile.church_id).eq("id", householdId).maybeSingle(),
    admin.from("members").select("id").eq("church_id", profile.church_id).eq("id", memberId).maybeSingle(),
  ]);
  if (!household || !member) redirect("/families?error=scope");

  const { error } = await admin.from("household_members").upsert(
    {
      church_id: profile.church_id,
      household_id: householdId,
      member_id: memberId,
      relationship: ["head", "spouse", "child", "parent", "relative", "member"].includes(relationship) ? relationship : "member",
      is_primary_contact: false,
      created_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "church_id,member_id" }
  );

  if (error) redirect(`/families?error=${encodeURIComponent(error.code || "assign")}`);
  revalidatePath("/families");
  redirect("/families?saved=member");
}
