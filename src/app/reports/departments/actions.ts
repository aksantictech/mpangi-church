"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { profileCanAccessDepartment } from "@/lib/security/departmentScope";

const editableRoles = new Set(["church_admin", "pasteur_t", "pastor", "responsable_d"]);
const value = (formData: FormData, key: string) => String(formData.get(key) || "").trim() || null;

export async function saveDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  if (!context.churchId || !editableRoles.has(context.role)) redirect("/unauthorized?reason=department_report");

  const departmentId = value(formData, "department_id");
  const reportMonth = value(formData, "report_month");
  if (!departmentId || !/^\d{4}-\d{2}-01$/.test(reportMonth || "")) redirect("/reports/departments?error=invalid");
  const validReportMonth = reportMonth as string;
  const periodStart = value(formData, "period_start") || validReportMonth;
  const periodEnd = value(formData, "period_end") || validReportMonth;
  const recipientIds = formData.getAll("recipient_ids").map(String).filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) || periodStart > periodEnd) redirect("/reports/departments?error=period");

  const admin = createAdminClient();
  const [{ data: department }, { data: profile }] = await Promise.all([
    admin.from("departments").select("id").eq("id", departmentId).eq("church_id", context.churchId).maybeSingle(),
    admin.from("profiles").select("id").eq("user_id", context.userId).eq("church_id", context.churchId).maybeSingle(),
  ]);
  if (!department || !profile) redirect("/unauthorized?reason=department_report_scope");

  if (context.role === "responsable_d") {
    const allowed = await profileCanAccessDepartment({ profileId: profile.id, churchId: context.churchId, departmentId, email: context.email });
    if (!allowed) redirect("/unauthorized?reason=department_report_scope");
  }

  const status = value(formData, "intent") === "submit" ? "submitted" : "draft";
  if (status === "submitted" && recipientIds.length === 0) redirect(`/reports/departments?department=${departmentId}&month=${validReportMonth.slice(0, 7)}&error=recipient`);
  const deadline = new Date(`${periodEnd}T23:59:59.000Z`);
  deadline.setUTCDate(deadline.getUTCDate() + 7);
  const payload = {
    church_id: context.churchId,
    department_id: departmentId,
    report_month: validReportMonth,
    period_start: periodStart,
    period_end: periodEnd,
    strengths: value(formData, "strengths"),
    weaknesses: value(formData, "weaknesses"),
    opportunities: value(formData, "opportunities"),
    threats: value(formData, "threats"),
    next_actions: value(formData, "next_actions"),
    status,
    created_by: profile.id,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
    sent_at: status === "submitted" ? new Date().toISOString() : null,
    edit_until: deadline.toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: savedReport, error } = await admin.from("department_monthly_reports").upsert(payload, { onConflict: "department_id,report_month" }).select("id").single();

  if (!error && savedReport && status === "submitted") {
    const { data: validRecipients } = await admin.from("profiles").select("id").eq("church_id", context.churchId).eq("status", "active").in("id", recipientIds.length ? recipientIds : ["00000000-0000-0000-0000-000000000000"]).in("role", ["church_admin", "admin", "pasteur_t", "pastor", "pastor_titulaire"]);
    await admin.from("department_report_recipients").delete().eq("report_id", savedReport.id);
    if (validRecipients?.length) await admin.from("department_report_recipients").insert(validRecipients.map((r: any) => ({ report_id: savedReport.id, church_id: context.churchId, profile_id: r.id })));
  }

  if (error) redirect(`/reports/departments?department=${departmentId}&month=${validReportMonth.slice(0, 7)}&error=save`);
  revalidatePath("/reports/departments");
  redirect(`/reports/departments?department=${departmentId}&month=${validReportMonth.slice(0, 7)}&saved=1`);
}

export async function deleteDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  const reportId = value(formData, "report_id");
  if (!context.churchId || !reportId || !editableRoles.has(context.role)) redirect("/reports/departments?error=invalid");
  const admin = createAdminClient();
  const { data: report } = await admin.from("department_monthly_reports").select("id,department_id,edit_until").eq("id", reportId).eq("church_id", context.churchId).maybeSingle();
  if (!report || !report.edit_until || new Date(report.edit_until) < new Date()) redirect("/reports/departments?error=deadline");
  if (context.role === "responsable_d") {
    const { data: profile } = await admin.from("profiles").select("id").eq("user_id", context.userId).eq("church_id", context.churchId).maybeSingle();
    const allowed = profile && await profileCanAccessDepartment({ profileId: profile.id, churchId: context.churchId, departmentId: report.department_id, email: context.email });
    if (!allowed) redirect("/unauthorized?reason=department_report_scope");
  }
  await admin.from("department_monthly_reports").delete().eq("id", report.id).eq("church_id", context.churchId);
  revalidatePath("/reports/departments");
  redirect("/reports/departments?deleted=1");
}
