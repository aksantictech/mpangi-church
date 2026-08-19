import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { requireActiveProfile } from "@/lib/security/access";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";
import { profileCanAccessDepartment } from "@/lib/security/departmentScope";
import { getDepartmentActivitySummaryForReport } from "@/lib/reports/departmentActivitySummary";

const REVIEW_ROLES = new Set([
  "church_admin",
  "pasteur_t",
  "pasteur_a",
  "secretaire",
]);

type RouteProps = {
  params: Promise<{ reportId: string }>;
};

function addWrappedText(doc: jsPDF, label: string, value: string | null, y: number) {
  doc.setFont("helvetica", "bold");
  doc.text(label, 15, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(value?.trim() || "Aucune information renseignée.", 180);
  doc.text(lines, 15, y + 6);
  return y + 8 + lines.length * 5;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const context = await requireActiveProfile();
  if (!context.churchId) {
    return NextResponse.json({ error: "Église introuvable." }, { status: 403 });
  }

  const { reportId } = await params;
  const role = normalizeRoleCode(context.role);

  const { data: report, error } = await context.admin
    .from("department_monthly_reports")
    .select(`
      id,church_id,department_id,report_month,period_start,period_end,
      strengths,weaknesses,opportunities,threats,next_actions,status,
      sent_at,validated_at,created_by,
      departments(name),
      creator:profiles!department_monthly_reports_created_by_fkey(full_name)
    `)
    .eq("id", reportId)
    .eq("church_id", context.churchId)
    .maybeSingle();

  if (error || !report) {
    return NextResponse.json({ error: "Rapport introuvable." }, { status: 404 });
  }

  if (role === "responsable_d") {
    const allowed = await profileCanAccessDepartment({
      profileId: context.profile.id,
      churchId: context.churchId,
      departmentId: report.department_id,
      email: context.profile.email || undefined,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  } else if (!REVIEW_ROLES.has(role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const department = Array.isArray(report.departments)
    ? report.departments[0]?.name
    : (report.departments as any)?.name;
  const sender = Array.isArray(report.creator)
    ? report.creator[0]?.full_name
    : (report.creator as any)?.full_name;

  const activitySummary = await getDepartmentActivitySummaryForReport({
    admin: context.admin,
    churchId: context.churchId,
    report,
  });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(18);
  doc.text("Rapport mensuel de département", 15, 18);
  doc.setFontSize(11);
  doc.text(`Département : ${department || "-"}`, 15, 28);
  doc.text(`Période : ${report.period_start || report.report_month} au ${report.period_end || "-"}`, 15, 35);
  doc.text(`Envoyé par : ${sender || "-"}`, 15, 42);
  doc.text(`Statut : ${report.validated_at ? "Validé" : report.status === "submitted" ? "Envoyé" : "Brouillon"}`, 15, 49);

  doc.setFont("helvetica", "bold");
  doc.text("Synthèse des activités", 15, 62);
  doc.setFont("helvetica", "normal");
  doc.text(`Activités réalisées : ${activitySummary.activities}`, 15, 69);
  doc.text(`Membres actifs : ${activitySummary.activeMembers}`, 15, 75);
  doc.text(`Stars / responsables : ${activitySummary.leaders}`, 15, 81);
  doc.text(`Présences enregistrées : ${activitySummary.attendanceCount}`, 105, 69);
  doc.text(`Taux de présence : ${activitySummary.attendanceRate}%`, 105, 75);
  doc.text(`Moyenne par activité : ${activitySummary.averageAttendance}`, 105, 81);

  let y = 92;
  for (const [label, value] of [
    ["Forces / points positifs", report.strengths],
    ["Faiblesses / difficultés", report.weaknesses],
    ["Opportunités", report.opportunities],
    ["Menaces / risques", report.threats],
    ["Actions prévues le mois prochain", report.next_actions],
  ] as Array<[string, string | null]>) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    y = addWrappedText(doc, label, value, y);
  }

  doc.setFontSize(8);
  doc.text(`Généré le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`, 15, 287);

  return new NextResponse(doc.output("arraybuffer"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-departement-${String(report.report_month).slice(0, 7)}.pdf"`,
    },
  });
}
