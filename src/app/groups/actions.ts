"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { requireAnyActionPermission } from "@/lib/security/secureAction";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function optional(value: FormDataEntryValue | null) {
  return text(value) || null;
}

export async function createMinistryGroupAction(formData: FormData) {
  await requireAnyActionPermission(["groups"], "create");
  const { admin, profile } = await requireChurchModuleAccess("groups", "can_create");
  const name = text(formData.get("name")).slice(0, 120);
  const groupType = text(formData.get("group_type"));
  const allowedTypes = new Set(["cellule", "discipulat", "priere", "jeunesse", "famille", "autre"]);
  const meetingDayRaw = text(formData.get("meeting_day"));
  const meetingDay = meetingDayRaw === "" ? null : Number(meetingDayRaw);
  const capacityRaw = Number(text(formData.get("capacity")) || "0");

  if (!name) redirect("/groups?error=name");
  if (meetingDay !== null && (!Number.isInteger(meetingDay) || meetingDay < 0 || meetingDay > 6)) {
    redirect("/groups?error=schedule");
  }

  const { error } = await admin.from("ministry_groups").insert({
    church_id: profile.church_id,
    name,
    group_type: allowedTypes.has(groupType) ? groupType : "cellule",
    description: optional(formData.get("description"))?.slice(0, 1000),
    meeting_day: meetingDay,
    meeting_time: optional(formData.get("meeting_time")),
    meeting_location: optional(formData.get("meeting_location"))?.slice(0, 180),
    capacity: capacityRaw >= 1 && capacityRaw <= 5000 ? capacityRaw : null,
    leader_profile_id: optional(formData.get("leader_profile_id")),
    status: "active",
    created_by: profile.id,
  });

  if (error) redirect(`/groups?error=${encodeURIComponent(error.code || "create")}`);
  revalidatePath("/groups");
  redirect("/groups?saved=group");
}

export async function assignGroupMemberAction(formData: FormData) {
  await requireAnyActionPermission(["groups"], "update");
  const { admin, profile } = await requireChurchModuleAccess("groups", "can_update");
  const groupId = text(formData.get("group_id"));
  const memberId = text(formData.get("member_id"));
  const memberRole = text(formData.get("member_role"));

  if (!groupId || !memberId) redirect("/groups?error=member");

  const [{ data: group }, { data: member }] = await Promise.all([
    admin.from("ministry_groups").select("id").eq("church_id", profile.church_id).eq("id", groupId).maybeSingle(),
    admin.from("members").select("id").eq("church_id", profile.church_id).eq("id", memberId).maybeSingle(),
  ]);

  if (!group || !member) redirect("/groups?error=scope");

  const { error } = await admin.from("ministry_group_members").upsert(
    {
      church_id: profile.church_id,
      group_id: groupId,
      member_id: memberId,
      member_role: ["leader", "assistant", "host", "member"].includes(memberRole) ? memberRole : "member",
      status: "active",
      created_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,member_id" }
  );

  if (error) redirect(`/groups?error=${encodeURIComponent(error.code || "assign")}`);
  revalidatePath("/groups");
  redirect("/groups?saved=member");
}
