"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { profileCanAccessDepartment } from "@/lib/security/departmentScope";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";

const REPORT_AUTHOR_ROLES = new Set(["responsable_d"]);

const REPORT_VALIDATOR_ROLES = new Set([
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "pasteur_a",
]);

const REPORT_RECIPIENT_ROLES = [
  "church_admin",
  "admin",
  "administrator",
  "admin_eglise",
  "owner",
  "pasteur_t",
  "pasteur",
  "pasteur_titulaire",
  "pastor",
  "pastor_titulaire",
  "pasteur_a",
  "pasteur_assistant",
  "pastor_assistant",
  "assistant_pastor",
  "secretaire",
  "secretary",
];

function isAutomaticRecipientRole(role?: string | null) {
  const rawRole = String(role || "").trim().toLowerCase();

  if (REPORT_RECIPIENT_ROLES.includes(rawRole)) {
    return true;
  }

  const normalizedRole = normalizeRoleCode(rawRole);

  return [
    "church_admin",
    "admin_eglise",
    "pasteur_t",
    "pasteur_a",
    "secretaire",
  ].includes(normalizedRole);
}

const value = (formData: FormData, key: string) =>
  String(formData.get(key) || "").trim() || null;

function reportUrl(
  departmentId: string,
  reportMonth: string,
  error?: string
) {
  const base = `/reports/departments?department=${departmentId}&month=${reportMonth.slice(
    0,
    7
  )}`;

  return error ? `${base}&error=${encodeURIComponent(error)}` : base;
}

export async function saveDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  const role = normalizeRoleCode(context.role);

  if (!context.churchId || !REPORT_AUTHOR_ROLES.has(role)) {
    redirect("/unauthorized?reason=department_report_author");
  }

  const departmentId = value(formData, "department_id");
  const reportMonth = value(formData, "report_month");

  if (!departmentId || !/^\d{4}-\d{2}-01$/.test(reportMonth || "")) {
    redirect("/reports/departments?error=invalid");
  }

  const validReportMonth = reportMonth as string;
  const periodStart = value(formData, "period_start") || validReportMonth;
  const periodEnd = value(formData, "period_end") || validReportMonth;

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(periodStart) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) ||
    periodStart > periodEnd
  ) {
    redirect(reportUrl(departmentId, validReportMonth, "period"));
  }

  const admin = createAdminClient();

  const [{ data: department }, { data: profile }] = await Promise.all([
    admin
      .from("departments")
      .select("id")
      .eq("id", departmentId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
  ]);

  if (!department || !profile) {
    redirect("/unauthorized?reason=department_report_scope");
  }

  const allowed = await profileCanAccessDepartment({
    profileId: profile.id,
    churchId: context.churchId,
    departmentId,
    email: context.email,
  });

  if (!allowed) {
    redirect("/unauthorized?reason=department_report_scope");
  }

  const status =
    value(formData, "intent") === "submit" ? "submitted" : "draft";

  let validRecipients: Array<{ id: string }> = [];

  if (status === "submitted") {
    const { data: recipientCandidates, error: recipientValidationError } =
      await admin
        .from("profiles")
        .select("id,role,status")
        .eq("church_id", context.churchId)
        .eq("status", "active");

    if (recipientValidationError) {
      console.error(
        "Chargement des destinataires automatiques impossible :",
        recipientValidationError.message
      );

      redirect(reportUrl(departmentId, validReportMonth, "recipient_invalid"));
    }

    validRecipients = (recipientCandidates || [])
      .filter((recipient: any) => isAutomaticRecipientRole(recipient.role))
      .map((recipient: any) => ({ id: recipient.id }));

    if (validRecipients.length === 0) {
      redirect(reportUrl(departmentId, validReportMonth, "recipient_missing"));
    }
  }

  const deadline = new Date(`${periodEnd}T23:59:59.000Z`);
  deadline.setUTCDate(deadline.getUTCDate() + 7);

  const now = new Date().toISOString();

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
    submitted_at: status === "submitted" ? now : null,
    sent_at: status === "submitted" ? now : null,
    edit_until: deadline.toISOString(),
    validated_at: null,
    validated_by: null,
    updated_at: now,
  };

  const { data: savedReport, error: saveError } = await admin
    .from("department_monthly_reports")
    .upsert(payload, { onConflict: "department_id,report_month" })
    .select("id")
    .single();

  if (saveError || !savedReport) {
    console.error(
      "Enregistrement du rapport de département impossible :",
      saveError?.message || "rapport non retourné"
    );

    redirect(reportUrl(departmentId, validReportMonth, "save"));
  }

  const { error: clearRecipientsError } = await admin
    .from("department_report_recipients")
    .delete()
    .eq("report_id", savedReport.id);

  if (clearRecipientsError) {
    console.error(
      "Nettoyage des anciens destinataires impossible :",
      clearRecipientsError.message
    );

    redirect(reportUrl(departmentId, validReportMonth, "recipient_save"));
  }

  if (status === "submitted") {
    const { error: recipientInsertError } = await admin
      .from("department_report_recipients")
      .insert(
        validRecipients.map((recipient) => ({
          report_id: savedReport.id,
          church_id: context.churchId,
          profile_id: recipient.id,
        }))
      );

    if (recipientInsertError) {
      console.error(
        "Enregistrement des destinataires impossible :",
        recipientInsertError.message
      );

      await admin
        .from("department_monthly_reports")
        .update({
          status: "draft",
          submitted_at: null,
          sent_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", savedReport.id)
        .eq("church_id", context.churchId);

      redirect(reportUrl(departmentId, validReportMonth, "recipient_save"));
    }
  }

  revalidatePath("/reports/departments");
  redirect(`${reportUrl(departmentId, validReportMonth)}&saved=1`);
}

export async function validateDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  const role = normalizeRoleCode(context.role);
  const reportId = value(formData, "report_id");

  if (
    !context.churchId ||
    !reportId ||
    !REPORT_VALIDATOR_ROLES.has(role)
  ) {
    redirect("/reports/departments?error=validation_forbidden");
  }

  const admin = createAdminClient();

  const [{ data: profile }, { data: report }] = await Promise.all([
    admin
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
    admin
      .from("department_monthly_reports")
      .select("id,department_id,report_month,status,validated_at")
      .eq("id", reportId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
  ]);

  if (!profile || !report || report.status !== "submitted") {
    redirect("/reports/departments?error=validation");
  }

  if (!report.validated_at) {
    const now = new Date().toISOString();

    const { error: validationError } = await admin
      .from("department_monthly_reports")
      .update({
        validated_at: now,
        validated_by: profile.id,
        updated_at: now,
      })
      .eq("id", report.id)
      .eq("church_id", context.churchId)
      .eq("status", "submitted");

    if (validationError) {
      console.error("Validation du rapport impossible :", validationError.message);
      redirect(
        `${reportUrl(
          report.department_id,
          String(report.report_month),
          "validation"
        )}&report=${report.id}`
      );
    }
  }

  await admin
    .from("department_report_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("church_id", context.churchId)
    .eq("profile_id", profile.id)
    .eq("report_id", report.id)
    .is("read_at", null);

  revalidatePath("/reports/departments");

  redirect(
    `${reportUrl(report.department_id, String(report.report_month))}&report=${
      report.id
    }&validated=1`
  );
}

export async function deleteDepartmentReportAction(formData: FormData) {
  const context = await getCurrentSecurityContext();
  const role = normalizeRoleCode(context.role);
  const reportId = value(formData, "report_id");

  if (
    !context.churchId ||
    !reportId ||
    !REPORT_AUTHOR_ROLES.has(role)
  ) {
    redirect("/reports/departments?error=invalid");
  }

  const admin = createAdminClient();

  const [{ data: profile }, { data: report }] = await Promise.all([
    admin
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
    admin
      .from("department_monthly_reports")
      .select("id,department_id,edit_until")
      .eq("id", reportId)
      .eq("church_id", context.churchId)
      .maybeSingle(),
  ]);

  if (
    !profile ||
    !report ||
    !report.edit_until ||
    new Date(report.edit_until) < new Date()
  ) {
    redirect("/reports/departments?error=deadline");
  }

  const allowed = await profileCanAccessDepartment({
    profileId: profile.id,
    churchId: context.churchId,
    departmentId: report.department_id,
    email: context.email,
  });

  if (!allowed) {
    redirect("/unauthorized?reason=department_report_scope");
  }

  await admin
    .from("department_monthly_reports")
    .delete()
    .eq("id", report.id)
    .eq("church_id", context.churchId);

  revalidatePath("/reports/departments");
  redirect("/reports/departments?deleted=1");
}
