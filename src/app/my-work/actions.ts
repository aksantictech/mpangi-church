"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

const ALLOWED_STATUSES = new Set([
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);

function getPeriodKey(frequency: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const date = String(now.getUTCDate()).padStart(2, "0");

  switch (frequency) {
    case "daily":
      return `${year}-${month}-${date}`;
    case "weekly": {
      const start = new Date(Date.UTC(year, 0, 1));
      const diff = Math.floor(
        (now.getTime() - start.getTime()) / 86400000
      );
      const week = String(Math.ceil((diff + start.getUTCDay() + 1) / 7))
        .padStart(2, "0");

      return `${year}-W${week}`;
    }
    case "monthly":
      return `${year}-${month}`;
    case "quarterly":
      return `${year}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
    case "yearly":
      return String(year);
    default:
      return `once-${year}`;
  }
}

export async function createTaskFromTemplateAction(
  formData: FormData
) {
  const context = await getCurrentSecurityContext();

  if (!context.churchId) {
    redirect("/unauthorized?reason=church_missing");
  }

  const templateId = String(
    formData.get("template_id") || ""
  );

  if (!templateId) {
    redirect("/my-work?error=template_missing");
  }

  const admin = createAdminClient();

  const { data: template, error } = await admin
    .from("church_role_task_templates")
    .select("*")
    .eq("id", templateId)
    .eq("church_id", context.churchId)
    .eq("role_code", context.role)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !template) {
    redirect("/my-work?error=template_not_allowed");
  }

  const periodKey = getPeriodKey(template.frequency);
  const dueAt = new Date();

  dueAt.setUTCDate(
    dueAt.getUTCDate() +
      Number(template.default_due_days || 0)
  );

  const { error: insertError } = await admin
    .from("church_user_role_tasks")
    .insert({
      church_id: context.churchId,
      template_id: template.id,
      assigned_to: context.userId,
      created_by: context.userId,
      title: template.title,
      description: template.description,
      priority: template.priority,
      status: "todo",
      due_at: dueAt.toISOString(),
      source_period: periodKey,
      metadata: {
        source: "role_template",
        role: context.role,
      },
    });

  if (insertError) {
    if (
      insertError.code === "23505" ||
      insertError.message.includes("duplicate")
    ) {
      redirect("/my-work?already=1");
    }

    redirect(
      `/my-work?error=${encodeURIComponent(
        insertError.message
      )}`
    );
  }

  revalidatePath("/my-work");
  redirect("/my-work?created=1");
}

export async function updateMyRoleTaskAction(
  formData: FormData
) {
  const context = await getCurrentSecurityContext();

  if (!context.churchId) {
    redirect("/unauthorized?reason=church_missing");
  }

  const taskId = String(formData.get("task_id") || "");
  const status = String(formData.get("status") || "");

  if (!taskId || !ALLOWED_STATUSES.has(status)) {
    redirect("/my-work?error=invalid_task_update");
  }

  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    status,
  };

  if (status === "done") {
    payload.completed_at = new Date().toISOString();
  } else {
    payload.completed_at = null;
  }

  const { error } = await admin
    .from("church_user_role_tasks")
    .update(payload)
    .eq("id", taskId)
    .eq("assigned_to", context.userId)
    .eq("church_id", context.churchId);

  if (error) {
    redirect(
      `/my-work?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/my-work");
}
