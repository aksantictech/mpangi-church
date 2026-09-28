"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function createPeopleFlowAction(formData: FormData) {
  await requireAnyActionPermission(["people_flows"], "create");
  const { admin, profile } = await requireChurchModuleAccess("people_flows", "can_create");
  const name = text(formData.get("name")).slice(0, 120);
  const firstStep = text(formData.get("first_step")).slice(0, 120);
  const triggerType = text(formData.get("trigger_type"));

  if (!name || !firstStep) redirect("/people-flows?error=required");

  const { data: flow, error } = await admin
    .from("people_flows")
    .insert({
      church_id: profile.church_id,
      name,
      description: text(formData.get("description")).slice(0, 1000) || null,
      trigger_type: ["manual", "new_member", "new_convert", "absence", "request"].includes(triggerType)
        ? triggerType
        : "manual",
      status: "active",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !flow) redirect(`/people-flows?error=${encodeURIComponent(error?.code || "create")}`);

  const { error: stepError } = await admin.from("people_flow_steps").insert({
    church_id: profile.church_id,
    flow_id: flow.id,
    name: firstStep,
    position: 1,
    due_after_days: Math.min(3650, Math.max(0, Number(text(formData.get("due_after_days"))) || 0)),
  });

  if (stepError) {
    await admin.from("people_flows").delete().eq("church_id", profile.church_id).eq("id", flow.id);
    redirect(`/people-flows?error=${encodeURIComponent(stepError.code || "step")}`);
  }

  revalidatePath("/people-flows");
  redirect("/people-flows?saved=flow");
}

export async function enrollFlowMemberAction(formData: FormData) {
  await requireAnyActionPermission(["people_flows"], "update");
  const { admin, profile } = await requireChurchModuleAccess("people_flows", "can_update");
  const flowId = text(formData.get("flow_id"));
  const memberId = text(formData.get("member_id"));

  if (!flowId || !memberId) redirect("/people-flows?error=member");

  const [{ data: flow }, { data: member }, { data: firstStep }] = await Promise.all([
    admin.from("people_flows").select("id").eq("church_id", profile.church_id).eq("id", flowId).eq("status", "active").maybeSingle(),
    admin.from("members").select("id, first_name, last_name").eq("church_id", profile.church_id).eq("id", memberId).maybeSingle(),
    admin.from("people_flow_steps").select("id, due_after_days").eq("church_id", profile.church_id).eq("flow_id", flowId).order("position").limit(1).maybeSingle(),
  ]);

  if (!flow || !member || !firstStep) redirect("/people-flows?error=scope");
  const nextActionAt = new Date();
  nextActionAt.setDate(nextActionAt.getDate() + Number(firstStep.due_after_days || 0));

  const { error } = await admin.from("people_flow_entries").insert({
    church_id: profile.church_id,
    flow_id: flowId,
    member_id: memberId,
    display_name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
    current_step_id: firstStep.id,
    status: "active",
    next_action_at: nextActionAt.toISOString(),
    created_by: profile.id,
  });

  if (error) redirect(`/people-flows?error=${encodeURIComponent(error.code || "enroll")}`);
  revalidatePath("/people-flows");
  redirect("/people-flows?saved=member");
}

export async function addPeopleFlowStepAction(formData: FormData) {
  await requireAnyActionPermission(["people_flows"], "update");
  const { admin, profile } = await requireChurchModuleAccess("people_flows", "can_update");
  const flowId = text(formData.get("flow_id"));
  const name = text(formData.get("name")).slice(0, 120);

  if (!flowId || !name) redirect("/people-flows?error=step");

  const [{ data: flow }, { data: lastStep }] = await Promise.all([
    admin.from("people_flows").select("id").eq("church_id", profile.church_id).eq("id", flowId).maybeSingle(),
    admin.from("people_flow_steps").select("position").eq("church_id", profile.church_id).eq("flow_id", flowId).order("position", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!flow) redirect("/people-flows?error=scope");

  const { error } = await admin.from("people_flow_steps").insert({
    church_id: profile.church_id,
    flow_id: flowId,
    name,
    position: Number(lastStep?.position || 0) + 1,
    due_after_days: Math.min(3650, Math.max(0, Number(text(formData.get("due_after_days"))) || 0)),
  });

  if (error) redirect(`/people-flows?error=${encodeURIComponent(error.code || "step")}`);
  revalidatePath("/people-flows");
  redirect("/people-flows?saved=step");
}

export async function advanceFlowEntryAction(formData: FormData) {
  await requireAnyActionPermission(["people_flows"], "update");
  const { admin, profile } = await requireChurchModuleAccess("people_flows", "can_update");
  const entryId = text(formData.get("entry_id"));

  const { data: entry } = await admin
    .from("people_flow_entries")
    .select("id, flow_id, current_step_id")
    .eq("church_id", profile.church_id)
    .eq("id", entryId)
    .eq("status", "active")
    .maybeSingle();

  if (!entry) redirect("/people-flows?error=entry");

  const { data: steps } = await admin
    .from("people_flow_steps")
    .select("id, position, due_after_days")
    .eq("church_id", profile.church_id)
    .eq("flow_id", entry.flow_id)
    .order("position");

  const currentIndex = (steps || []).findIndex((step) => step.id === entry.current_step_id);
  const nextStep = (steps || [])[currentIndex + 1];
  const now = new Date();

  const { error } = await admin
    .from("people_flow_entries")
    .update(
      nextStep
        ? {
            current_step_id: nextStep.id,
            next_action_at: new Date(now.getTime() + Number(nextStep.due_after_days || 0) * 86_400_000).toISOString(),
            updated_at: now.toISOString(),
          }
        : { status: "completed", completed_at: now.toISOString(), next_action_at: null, updated_at: now.toISOString() }
    )
    .eq("church_id", profile.church_id)
    .eq("id", entry.id);

  if (error) redirect("/people-flows?error=advance");

  await admin.from("people_flow_history").insert({
    church_id: profile.church_id,
    entry_id: entry.id,
    from_step_id: entry.current_step_id,
    to_step_id: nextStep?.id || null,
    note: nextStep ? "Passage à l’étape suivante." : "Parcours terminé.",
    changed_by: profile.id,
  });

  revalidatePath("/people-flows");
}
