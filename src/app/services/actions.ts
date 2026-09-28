"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function createServicePlanAction(formData: FormData) {
  await requireAnyActionPermission(["services"], "create");
  const { admin, profile } = await requireChurchModuleAccess("services", "can_create");
  const title = text(formData.get("title")).slice(0, 140);
  const startsAtRaw = text(formData.get("starts_at"));
  const startsAt = new Date(startsAtRaw);
  const firstPosition = text(formData.get("first_position")).slice(0, 100);
  const serviceType = text(formData.get("service_type"));

  if (!title || !startsAtRaw || Number.isNaN(startsAt.getTime()) || !firstPosition) {
    redirect("/services?error=required");
  }

  const { data: plan, error } = await admin
    .from("service_plans")
    .insert({
      church_id: profile.church_id,
      title,
      service_type: ["culte", "priere", "conference", "jeunesse", "repetition", "autre"].includes(serviceType)
        ? serviceType
        : "culte",
      starts_at: startsAt.toISOString(),
      location: text(formData.get("location")).slice(0, 180) || null,
      notes: text(formData.get("notes")).slice(0, 1500) || null,
      status: "published",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !plan) redirect(`/services?error=${encodeURIComponent(error?.code || "create")}`);

  const requiredCount = Math.min(500, Math.max(1, Number(text(formData.get("required_count"))) || 1));
  const { error: positionError } = await admin.from("service_positions").insert({
    church_id: profile.church_id,
    service_plan_id: plan.id,
    name: firstPosition,
    required_count: requiredCount,
    position: 1,
  });

  if (positionError) {
    await admin.from("service_plans").delete().eq("church_id", profile.church_id).eq("id", plan.id);
    redirect(`/services?error=${encodeURIComponent(positionError.code || "position")}`);
  }

  revalidatePath("/services");
  redirect("/services?saved=service");
}

export async function assignServiceVolunteerAction(formData: FormData) {
  await requireAnyActionPermission(["services"], "update");
  const { admin, profile } = await requireChurchModuleAccess("services", "can_update");
  const planId = text(formData.get("service_plan_id"));
  const positionId = text(formData.get("position_id"));
  const memberId = text(formData.get("member_id"));

  if (!planId || !positionId || !memberId) redirect("/services?error=volunteer");

  const [{ data: position }, { data: member }] = await Promise.all([
    admin.from("service_positions").select("id, service_plan_id").eq("church_id", profile.church_id).eq("id", positionId).eq("service_plan_id", planId).maybeSingle(),
    admin.from("members").select("id").eq("church_id", profile.church_id).eq("id", memberId).maybeSingle(),
  ]);

  if (!position || !member) redirect("/services?error=scope");

  const { error } = await admin.from("service_assignments").upsert(
    {
      church_id: profile.church_id,
      service_plan_id: planId,
      position_id: positionId,
      member_id: memberId,
      status: "confirmed",
      assigned_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "position_id,member_id" }
  );

  if (error) redirect(`/services?error=${encodeURIComponent(error.code || "assign")}`);
  revalidatePath("/services");
  redirect("/services?saved=volunteer");
}

export async function addServicePositionAction(formData: FormData) {
  await requireAnyActionPermission(["services"], "update");
  const { admin, profile } = await requireChurchModuleAccess("services", "can_update");
  const planId = text(formData.get("service_plan_id"));
  const name = text(formData.get("name")).slice(0, 100);

  if (!planId || !name) redirect("/services?error=position");

  const [{ data: plan }, { data: lastPosition }] = await Promise.all([
    admin.from("service_plans").select("id").eq("church_id", profile.church_id).eq("id", planId).maybeSingle(),
    admin.from("service_positions").select("position").eq("church_id", profile.church_id).eq("service_plan_id", planId).order("position", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!plan) redirect("/services?error=scope");

  const { error } = await admin.from("service_positions").insert({
    church_id: profile.church_id,
    service_plan_id: planId,
    name,
    required_count: Math.min(500, Math.max(1, Number(text(formData.get("required_count"))) || 1)),
    position: Number(lastPosition?.position || 0) + 1,
  });

  if (error) redirect(`/services?error=${encodeURIComponent(error.code || "position")}`);
  revalidatePath("/services");
  redirect("/services?saved=position");
}
