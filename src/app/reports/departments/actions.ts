"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

const editableRoles = new Set(["church_admin", "pasteur_t", "pastor", "responsable_d"]);
const value = (formData: FormData, key: string) => String(formData.get(key) || "").trim() || null;

export async function saveDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  if (!context.churchId || !editableRoles.has(context.role)) redirect("/unauthorized?reason=department_report");

  const departmentId = value(formData, "department_id");
  const reportMonth = value(formData, "report_month");
  if (!departmentId || !/^\d{4}-\d{2}-01$/.test(reportMonth || "")) redirect("/reports/departments?error=invalid");
  const validReportMonth = reportMonth as string;

  const admin = createAdminClient();
  const [{ data: department }, { data: profile }] = await Promise.all([
    admin.from("departments").select("id").eq("id", departmentId).eq("church_id", context.churchId).maybeSingle(),
    admin.from("profiles").select("id").eq("user_id", context.userId).eq("church_id", context.churchId).maybeSingle(),
  ]);
  if (!department || !profile) redirect("/unauthorized?reason=department_report_scope");

  if (context.role === "responsable_d") {
    const { data: member } = context.email ? await admin.from("members").select("id").eq("church_id", context.churchId).ilike("email", context.email).maybeSingle() : { data: null };
    const { data: assignment } = member ? await admin.from("member_departments").select("role").eq("church_id", context.churchId).eq("department_id", departmentId).eq("member_id", member.id).maybeSingle() : { data: null };
    if (!assignment || !["leader", "responsable", "manager", "responsable_d", "department_leader"].includes(String(assignment.role || "").toLowerCase())) redirect("/unauthorized?reason=department_report_scope");
  }

  const status = value(formData, "intent") === "submit" ? "submitted" : "draft";
  const { error } = await admin.from("department_monthly_reports").upsert({
    church_id: context.churchId,
    department_id: departmentId,
    report_month: validReportMonth,
    strengths: value(formData, "strengths"),
    weaknesses: value(formData, "weaknesses"),
    opportunities: value(formData, "opportunities"),
    threats: value(formData, "threats"),
    next_actions: value(formData, "next_actions"),
    status,
    created_by: profile.id,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "department_id,report_month" });

  if (error) redirect(`/reports/departments?department=${departmentId}&month=${validReportMonth.slice(0, 7)}&error=save`);
  revalidatePath("/reports/departments");
  redirect(`/reports/departments?department=${departmentId}&month=${validReportMonth.slice(0, 7)}&saved=1`);
}
