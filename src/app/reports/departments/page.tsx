import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Send,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";

import MetricCard from "@/components/dashboard/MetricCard";
import AppShell from "@/components/layout/AppShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";
import { normalizeRoleCode } from "@/lib/security/roleCatalog";
import { getDepartmentActivitySummaryForReport } from "@/lib/reports/departmentActivitySummary";
import {
  deleteDepartmentReportAction,
  saveDepartmentReportAction,
  validateDepartmentReportAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    department?: string;
    month?: string;
    report?: string;
    status?: string;
    filterMonth?: string;
    received?: string;
    saved?: string;
    deleted?: string;
    validated?: string;
    validation_received?: string;
    error?: string;
  }>;
};

const field =
  "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

const VALIDATOR_ROLES = new Set([
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "pasteur_a",
]);

const REVIEW_ONLY_ROLES = new Set(["secretaire"]);

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

function recipientRoleLabel(role?: string | null) {
  const value = String(role || "").toLowerCase();

  if (
    [
      "church_admin",
      "admin",
      "administrator",
      "admin_eglise",
      "owner",
    ].includes(value)
  ) {
    return "Administrateur église";
  }

  if (
    [
      "pasteur_t",
      "pasteur",
      "pasteur_titulaire",
      "pastor",
      "pastor_titulaire",
    ].includes(value)
  ) {
    return "Pasteur titulaire";
  }

  if (
    [
      "pasteur_a",
      "pasteur_assistant",
      "pastor_assistant",
      "assistant_pastor",
    ].includes(value)
  ) {
    return "Pasteur assistant";
  }

  if (["secretaire", "secretary"].includes(value)) {
    return "Secrétaire";
  }

  return role || "Destinataire";
}

function reportErrorMessage(code?: string) {
  const messages: Record<string, string> = {
    invalid: "Les informations du rapport sont incomplètes.",
    period: "La période sélectionnée est invalide.",
    recipient_missing:
      "Aucun Pasteur titulaire, Pasteur assistant, Administrateur ou Secrétaire actif n’est configuré dans cette église.",
    recipient_invalid:
      "Impossible de déterminer les destinataires automatiques du rapport.",
    recipient_save:
      "Le rapport a été conservé en brouillon car ses destinataires n’ont pas pu être enregistrés.",
    save: "Impossible d’enregistrer le rapport.",
    deadline: "Le délai de modification de ce rapport est dépassé.",
    validation: "Impossible de valider ce rapport.",
    validation_forbidden: "Votre rôle ne peut pas valider ce rapport.",
    validated_locked: "Ce rapport est validé et verrouillé. Il ne peut plus être modifié, renvoyé ou supprimé.",
  };

  return (
    messages[code || ""] ||
    "Une erreur a empêché l’opération sur le rapport."
  );
}

function formatMonth(value?: string | null) {
  if (!value) return "-";
  const month = String(value).slice(0, 7);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`));
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ReadOnlyReport({ report, activitySummary }: { report: any; activitySummary?: any }) {
  return (
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#DCEAF5] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-slate-400">
            Rapport transmis
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#03357A]">
            {report.departments?.name || "Département"} — {formatMonth(report.report_month)}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Période : {report.period_start || "-"} au {report.period_end || "-"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Envoyé par {report.sender_name || "Utilisateur non identifié"}
            {report.sent_at ? ` · ${formatDateTime(report.sent_at)}` : ""}
          </p>
        </div>

        <span
          className={[
            "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black",
            report.validated_at
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {report.validated_at ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : null}
          {report.validated_at ? "Validé" : "En attente de validation"}
        </span>
      </div>

      {activitySummary && (
        <section className="mt-5 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
          <p className="text-xs font-black uppercase tracking-[.2em] text-slate-400">
            Données récupérées automatiquement
          </p>
          <h3 className="mt-2 text-xl font-black text-[#03357A]">Synthèse des activités</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard title="Activités réalisées" value={activitySummary.activities} description="Activités avec au moins une présence" icon={Activity} accent="blue" />
            <MetricCard title="Nombre de stars" value={activitySummary.leaders} description="Stars et responsables actifs" icon={Star} accent="orange" />
            <MetricCard title="Taux de présence" value={`${activitySummary.attendanceRate}%`} description={`${activitySummary.attendanceCount} présence(s) sur ${activitySummary.expectedAttendances} attendue(s)`} icon={CalendarCheck} accent="green" />
            <MetricCard title="Membres actifs" value={activitySummary.activeMembers} description="Affectations actives" icon={Users} accent="purple" />
            <MetricCard title="Présences enregistrées" value={activitySummary.attendanceCount} description="Participations uniques" icon={CalendarCheck} accent="green" />
            <MetricCard title="Moyenne par activité" value={activitySummary.averageAttendance} description="Membres présents" icon={TrendingUp} accent="blue" />
          </div>
        </section>
      )}

      <h3 className="mt-6 text-lg font-black text-[#03357A]">Analyse FFOM et actions</h3>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ReadOnlyField label="Forces / points positifs" value={report.strengths} />
        <ReadOnlyField label="Faiblesses / difficultés" value={report.weaknesses} />
        <ReadOnlyField label="Opportunités" value={report.opportunities} />
        <ReadOnlyField label="Menaces / risques" value={report.threats} />
        <div className="lg:col-span-2">
          <ReadOnlyField
            label="Actions prévues le mois prochain"
            value={report.next_actions}
          />
        </div>
      </div>

      {report.validated_at && (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          Rapport validé le {formatDateTime(report.validated_at)}.
        </div>
      )}
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <p className="text-sm font-black text-[#03357A]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {value?.trim() || "Aucune information renseignée."}
      </p>
    </div>
  );
}

export default async function DepartmentReportsPage({
  searchParams,
}: Props) {
  const sp = searchParams ? await searchParams : {};
  const context = await getCurrentSecurityContext();

  if (!context.churchId) return null;

  const role = normalizeRoleCode(context.role);
  const isDepartmentResponsible = role === "responsable_d";
  const canValidate = VALIDATOR_ROLES.has(role);
  const canReview = canValidate || REVIEW_ONLY_ROLES.has(role);

  if (!isDepartmentResponsible && !canReview) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6 font-bold text-red-700">
          Votre rôle n’est pas autorisé à consulter les rapports des départements.
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();

  const { data: currentProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("church_id", context.churchId)
    .maybeSingle();

  if (sp.validation_received === "1" && currentProfile) {
    await admin
      .from("department_monthly_reports")
      .update({ author_validation_read_at: new Date().toISOString() })
      .eq("church_id", context.churchId)
      .eq("created_by", currentProfile.id)
      .not("validated_at", "is", null)
      .is("author_validation_read_at", null);
  }

  if (sp.received === "1" && currentProfile) {
    await admin
      .from("department_report_recipients")
      .update({ read_at: new Date().toISOString() })
      .eq("church_id", context.churchId)
      .eq("profile_id", currentProfile.id)
      .is("read_at", null);
  }

  let allowedDepartmentIds: string[] | null = null;

  if (isDepartmentResponsible) {
    allowedDepartmentIds = await getProfileDepartmentIds({
      userId: context.userId,
      churchId: context.churchId,
      email: context.email,
    });
  }

  let departmentsQuery = admin
    .from("departments")
    .select("id,name")
    .eq("church_id", context.churchId)
    .eq("status", "active")
    .order("name");

  if (allowedDepartmentIds) {
    departmentsQuery = departmentsQuery.in(
      "id",
      allowedDepartmentIds.length
        ? allowedDepartmentIds
        : ["00000000-0000-0000-0000-000000000000"]
    );
  }

  const { data: departments } = await departmentsQuery;

  if (!departments?.length) {
    return (
      <AppShell>
        <p className="rounded-3xl bg-white p-6">
          Aucun département actif n’est disponible pour ce compte.
        </p>
      </AppShell>
    );
  }

  if (canReview && !isDepartmentResponsible) {
    const requestedDepartment = departments.some(
      (department: any) => department.id === sp.department
    )
      ? sp.department || ""
      : "";

    const requestedMonth = /^\d{4}-\d{2}$/.test(sp.month || "")
      ? sp.month || ""
      : "";

    const { data: allSubmittedReports, error: reviewReportsError } = await admin
      .from("department_monthly_reports")
      .select(
        "id,department_id,report_month,period_start,period_end,strengths,weaknesses,opportunities,threats,next_actions,status,sent_at,submitted_at,created_by,validated_at,validated_by,departments(name)"
      )
      .eq("church_id", context.churchId)
      .eq("status", "submitted")
      .order("report_month", { ascending: false })
      .order("sent_at", { ascending: false })
      .limit(500);

    if (reviewReportsError) {
      console.error(
        "Chargement des rapports soumis impossible :",
        reviewReportsError.message
      );
    }

    const submittedReports = allSubmittedReports || [];
    const dashboardMonth =
      requestedMonth ||
      String(submittedReports[0]?.report_month || "").slice(0, 7) ||
      new Date().toISOString().slice(0, 7);

    const monthReports = submittedReports.filter(
      (item: any) => String(item.report_month).slice(0, 7) === dashboardMonth
    );

    const creatorIds = [
      ...new Set(
        monthReports
          .map((item: any) => item.created_by)
          .filter(Boolean)
      ),
    ];

    const { data: creatorProfiles } = creatorIds.length
      ? await admin
          .from("profiles")
          .select("id,full_name,email")
          .eq("church_id", context.churchId)
          .in("id", creatorIds)
      : { data: [] as any[] };

    const creatorMap = new Map(
      (creatorProfiles || []).map((profile: any) => [
        profile.id,
        profile.full_name || profile.email || "Utilisateur",
      ])
    );

    const enrichedMonthReports = monthReports.map((item: any) => ({
      ...item,
      sender_name:
        creatorMap.get(item.created_by) || "Utilisateur non identifié",
    }));

    const scopeDepartments = requestedDepartment
      ? departments.filter((department: any) => department.id === requestedDepartment)
      : departments;

    const scopeReports = enrichedMonthReports.filter(
      (item: any) =>
        !requestedDepartment || item.department_id === requestedDepartment
    );

    const reportByDepartment = new Map(
      scopeReports.map((item: any) => [item.department_id, item])
    );

    const expectedReports = scopeDepartments.length;
    const receivedReports = reportByDepartment.size;
    const completenessRate = expectedReports
      ? Math.round((receivedReports / expectedReports) * 100)
      : 0;

    function isPromptReport(item: any) {
      if (!item?.sent_at) return false;

      const periodEnd = item.period_end
        ? new Date(`${item.period_end}T23:59:59.999Z`)
        : (() => {
            const date = new Date(`${String(item.report_month).slice(0, 7)}-01T00:00:00Z`);
            date.setUTCMonth(date.getUTCMonth() + 1);
            date.setUTCDate(date.getUTCDate() - 1);
            date.setUTCHours(23, 59, 59, 999);
            return date;
          })();

      const deadline = new Date(periodEnd);
      deadline.setUTCDate(deadline.getUTCDate() + 7);

      return new Date(item.sent_at).getTime() <= deadline.getTime();
    }

    const promptReports = scopeReports.filter(isPromptReport).length;
    const promptitudeRate = receivedReports
      ? Math.round((promptReports / receivedReports) * 100)
      : 0;
    const validatedReports = scopeReports.filter(
      (item: any) => Boolean(item.validated_at)
    ).length;
    const validationRate = receivedReports
      ? Math.round((validatedReports / receivedReports) * 100)
      : 0;

    const departmentRows = scopeDepartments.map((department: any) => {
      const item: any = reportByDepartment.get(department.id) || null;

      return {
        department,
        report: item,
        received: Boolean(item),
        prompt: item ? isPromptReport(item) : false,
      };
    });

    const reviewReports = scopeReports;
    const selectedReport = sp.report
      ? enrichedMonthReports.find((item: any) => item.id === sp.report) || null
      : null;

    const selectedReportActivitySummary = selectedReport
      ? await getDepartmentActivitySummaryForReport({
          admin,
          churchId: context.churchId,
          report: selectedReport,
        })
      : null;

    return (
      <AppShell>
        <div className="space-y-6 pb-24 md:pb-0">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux rapports
          </Link>

          <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[.25em] text-blue-100">
              Pilotage des rapports
            </p>
            <h1 className="mt-3 text-3xl font-black">
              Rapports des départements
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-blue-50">
              Suivez la complétude et la promptitude de tous les départements,
              identifiez l’expéditeur de chaque rapport, puis visualisez et validez
              les rapports transmis.
            </p>
          </section>

          {sp.validated === "1" && (
            <div className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">
              Rapport validé avec succès.
            </div>
          )}

          {sp.error && (
            <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
              {reportErrorMessage(sp.error)}
            </div>
          )}

          <form
            method="get"
            className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 sm:grid-cols-[1fr_180px_auto]"
          >
            <select
              name="department"
              defaultValue={requestedDepartment}
              className="h-12 rounded-2xl border border-[#DCEAF5] px-4 font-bold text-[#03357A]"
            >
              <option value="">Tous les départements</option>
              {departments.map((department: any) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <input
              type="month"
              name="month"
              defaultValue={dashboardMonth}
              className="h-12 rounded-2xl border border-[#DCEAF5] px-4"
            />

            <button className="rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white">
              Filtrer
            </button>
          </form>

          <section>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-black text-[#03357A]">
                  Tableau de complétude — {formatMonth(`${dashboardMonth}-01`)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  La promptitude correspond à un envoi effectué au plus tard 7 jours après la fin de la période du rapport.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Complétude des rapports"
                value={`${completenessRate}%`}
                description={`${receivedReports} reçu(s) sur ${expectedReports} attendu(s)`}
                icon={Users}
                accent="blue"
              />
              <MetricCard
                title="Taux de promptitude"
                value={`${promptitudeRate}%`}
                description={`${promptReports} rapport(s) reçu(s) dans le délai`}
                icon={CalendarCheck}
                accent="green"
              />
              <MetricCard
                title="Taux de validation"
                value={`${validationRate}%`}
                description={`${validatedReports} validé(s) sur ${receivedReports} reçu(s)`}
                icon={CheckCircle2}
                accent="purple"
              />
              <MetricCard
                title="Rapports manquants"
                value={Math.max(0, expectedReports - receivedReports)}
                description="Département(s) sans rapport transmis"
                icon={TrendingUp}
                accent="orange"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Complétude par département
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Un département sans rapport reste visible afin d’identifier immédiatement les manquants.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {departmentRows.map(({ department, report: item, received, prompt }: any) => (
                <article
                  key={department.id}
                  className="grid gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 lg:grid-cols-[1.15fr_0.7fr_1.2fr_0.8fr_0.8fr_auto] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Département
                    </p>
                    <p className="mt-1 font-black text-[#03357A]">
                      {department.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Complétude
                    </p>
                    <span
                      className={[
                        "mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black",
                        received
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                      ].join(" ")}
                    >
                      {received ? "Reçu" : "Manquant"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Envoyé par
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {item?.sender_name || "—"}
                    </p>
                    {item?.sent_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(item.sent_at)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Promptitude
                    </p>
                    <span
                      className={[
                        "mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black",
                        !received
                          ? "bg-slate-100 text-slate-500"
                          : prompt
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-orange-700",
                      ].join(" ")}
                    >
                      {!received ? "—" : prompt ? "À temps" : "En retard"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Validation
                    </p>
                    <span
                      className={[
                        "mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black",
                        item?.validated_at
                          ? "bg-emerald-50 text-emerald-700"
                          : received
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {item?.validated_at ? "Validé" : received ? "À valider" : "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {item && (
                      <Link
                        href={`/reports/departments?department=${department.id}&month=${dashboardMonth}&report=${item.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#EAF3FA] px-3 text-xs font-black text-[#03357A]"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>
                    )}

                    {item && (
                      <a
                        href={`/api/reports/departments/${item.id}/pdf`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    )}

                    {item && canValidate && !item.validated_at && (
                      <form action={validateDepartmentReportAction}>
                        <input type="hidden" name="report_id" value={item.id} />
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white">
                          <CheckCircle2 className="h-4 w-4" />
                          Valider
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {selectedReport && (
            <>
              <ReadOnlyReport report={selectedReport} activitySummary={selectedReportActivitySummary} />

              <div className="flex justify-end">
                <a
                  href={`/api/reports/departments/${selectedReport.id}/pdf`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-700"
                >
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </a>
              </div>

              {canValidate && !selectedReport.validated_at && (
                <form
                  action={validateDepartmentReportAction}
                  className="flex justify-end"
                >
                  <input
                    type="hidden"
                    name="report_id"
                    value={selectedReport.id}
                  />
                  <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-black text-white shadow-sm transition hover:bg-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Valider ce rapport
                  </button>
                </form>
              )}
            </>
          )}

          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#03357A]">
                  Rapports reçus
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Période {formatMonth(`${dashboardMonth}-01`)}. Les brouillons restent invisibles.
                </p>
              </div>
              <span className="rounded-full bg-[#EAF3FA] px-4 py-2 text-sm font-black text-[#03357A]">
                {reviewReports.length} rapport(s)
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {reviewReports.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FBFD] p-6 text-center text-sm font-bold text-slate-500">
                  Aucun rapport transmis pour les filtres sélectionnés.
                </div>
              ) : (
                reviewReports.map((item: any) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[#DCEAF5] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-[#03357A]">
                        {item.departments?.name || "Département"} — {formatMonth(item.report_month)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Envoyé par {item.sender_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.sent_at ? `Transmis le ${formatDateTime(item.sent_at)}` : "Date d’envoi non renseignée"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-black",
                            item.validated_at
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700",
                          ].join(" ")}
                        >
                          {item.validated_at ? "Validé" : "À valider"}
                        </span>
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-black",
                            isPromptReport(item)
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-orange-50 text-orange-700",
                          ].join(" ")}
                        >
                          {isPromptReport(item) ? "À temps" : "En retard"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/reports/departments?department=${item.department_id}&month=${dashboardMonth}&report=${item.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]"
                      >
                        <Eye className="h-4 w-4" />
                        Visualiser
                      </Link>

                      <a
                        href={`/api/reports/departments/${item.id}/pdf`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-700"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>

                      {canValidate && !item.validated_at && (
                        <form action={validateDepartmentReportAction}>
                          <input type="hidden" name="report_id" value={item.id} />
                          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white">
                            <CheckCircle2 className="h-4 w-4" />
                            Valider
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const month = /^\d{4}-\d{2}$/.test(sp.month || "")
    ? sp.month!
    : new Date().toISOString().slice(0, 7);
  const from = `${month}-01`;
  const untilDate = new Date(`${from}T00:00:00Z`);
  untilDate.setUTCMonth(untilDate.getUTCMonth() + 1);
  const until = untilDate.toISOString().slice(0, 10);

  const departmentId = departments.some((department: any) => department.id === sp.department)
    ? sp.department!
    : departments[0].id;

  const [
    { data: assignments },
    { data: events },
    { data: selectedReport },
    { data: reports },
    { data: recipientCandidates, error: recipientLoadError },
  ] = await Promise.all([
    admin
      .from("member_departments")
      .select("member_id,role,status,members(status)")
      .eq("church_id", context.churchId)
      .eq("department_id", departmentId),
    admin
      .from("events")
      .select("id,event_date")
      .eq("church_id", context.churchId)
      .gte("event_date", from)
      .lt("event_date", until),
    sp.report
      ? admin
          .from("department_monthly_reports")
          .select("*")
          .eq("church_id", context.churchId)
          .eq("department_id", departmentId)
          .eq("id", sp.report)
          .maybeSingle()
      : admin
          .from("department_monthly_reports")
          .select("*")
          .eq("church_id", context.churchId)
          .eq("department_id", departmentId)
          .eq("report_month", from)
          .maybeSingle(),
    admin
      .from("department_monthly_reports")
      .select(
        "id,department_id,report_month,period_start,period_end,status,edit_until,sent_at,validated_at,validated_by,departments(name)"
      )
      .eq("church_id", context.churchId)
      .eq("department_id", departmentId)
      .order("report_month", { ascending: false })
      .limit(36),
    admin
      .from("profiles")
      .select("id,full_name,role,status")
      .eq("church_id", context.churchId)
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (recipientLoadError) {
    console.error(
      "Chargement des profils destinataires impossible :",
      recipientLoadError.message
    );
  }

  const recipients = (recipientCandidates || []).filter((recipient: any) =>
    isAutomaticRecipientRole(recipient.role)
  );
  const report = selectedReport;
  const reportLocked = Boolean(report?.validated_at);
  const activeAssignments = (assignments || []).filter((assignment: any) => {
    const member = Array.isArray(assignment.members)
      ? assignment.members[0]
      : assignment.members;
    return (
      assignment.status === "active" &&
      (!member?.status || ["active", "actif"].includes(member.status))
    );
  });
  const activeMemberIds = [
    ...new Set(
      activeAssignments
        .map((assignment: any) => assignment.member_id)
        .filter(Boolean)
    ),
  ];
  const eventIds = (events || []).map((event: any) => event.id);
  const { data: attendances } =
    activeMemberIds.length && eventIds.length
      ? await admin
          .from("event_attendances")
          .select("member_id,event_id")
          .eq("church_id", context.churchId)
          .in("member_id", activeMemberIds)
          .in("event_id", eventIds)
      : { data: [] as any[] };
  const activeMembers = activeMemberIds.length;
  const leaders = new Set(
    activeAssignments
      .filter((assignment: any) =>
        [
          "star",
          "leader",
          "responsable",
          "manager",
          "responsable_d",
          "department_leader",
        ].includes(String(assignment.role || "").toLowerCase())
      )
      .map((assignment: any) => assignment.member_id)
  ).size;
  const uniqueAttendances = new Set(
    (attendances || []).map(
      (attendance: any) => `${attendance.event_id}:${attendance.member_id}`
    )
  );
  const representedActivities = new Set(
    (attendances || []).map((attendance: any) => attendance.event_id)
  ).size;
  const attendanceCount = uniqueAttendances.size;
  const averageAttendance = representedActivities
    ? Math.round(attendanceCount / representedActivities)
    : 0;
  const expectedAttendances = activeMembers * representedActivities;
  const attendanceRate = expectedAttendances
    ? Math.min(100, Math.round((attendanceCount / expectedAttendances) * 100))
    : 0;
  const reportedMonths = new Set(
    (reports || []).map((item: any) => String(item.report_month).slice(0, 7))
  );
  const missingMonths = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    return date.toISOString().slice(0, 7);
  }).filter((item) => !reportedMonths.has(item));

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux rapports
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.25em] text-blue-100">
            Pilotage mensuel
          </p>
          <h1 className="mt-3 text-3xl font-black">Rapport du département</h1>
          <p className="mt-2 text-sm text-blue-50">
            Les chiffres sont calculés automatiquement depuis les membres,
            événements et présences enregistrés.
          </p>
        </section>

        <form
          method="get"
          className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 sm:grid-cols-[1fr_180px_auto]"
        >
          <select
            name="department"
            defaultValue={departmentId}
            className="h-12 rounded-2xl border border-[#DCEAF5] px-4 font-bold text-[#03357A]"
          >
            {departments.map((department: any) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="h-12 rounded-2xl border border-[#DCEAF5] px-4"
          />
          <button className="rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white">
            Afficher
          </button>
        </form>

        {sp.saved && (
          <p className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">
            Rapport enregistré.
          </p>
        )}
        {sp.error && (
          <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">
            {reportErrorMessage(sp.error)}
          </p>
        )}

        {missingMonths.length > 0 && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black text-amber-900">Mois sans rapport</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingMonths.map((item) => (
                <Link
                  key={item}
                  href={`/reports/departments?department=${departmentId}&month=${item}`}
                  className="rounded-full bg-white px-3 py-2 text-xs font-bold text-amber-800"
                >
                  {formatMonth(`${item}-01`)}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="flex flex-col gap-3 bg-gradient-to-r from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-blue-100">
                Données récupérées automatiquement
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Synthèse des activités
              </h2>
              <p className="mt-1 text-sm text-blue-50">
                Période du{" "}
                {new Intl.DateTimeFormat("fr-FR").format(
                  new Date(`${from}T00:00:00`)
                )}{" "}
                au{" "}
                {new Intl.DateTimeFormat("fr-FR").format(
                  new Date(untilDate.getTime() - 86400000)
                )}
                .
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black ring-1 ring-white/20">
              <TrendingUp className="h-4 w-4" />
              Mise à jour en temps réel
            </span>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3">
            <article className="rounded-3xl bg-blue-50 p-5 text-blue-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                <Activity className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-blue-700">
                Activités réalisées
              </p>
              <p className="mt-1 text-4xl font-black">{representedActivities}</p>
              <p className="mt-2 text-sm leading-6 text-blue-700">
                Activités de la période ayant au moins une présence enregistrée
                pour ce département.
              </p>
            </article>

            <article className="rounded-3xl bg-amber-50 p-5 text-amber-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <Star className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-amber-700">
                Nombre de stars
              </p>
              <p className="mt-1 text-4xl font-black">{leaders}</p>
              <p className="mt-2 text-sm leading-6 text-amber-700">
                Stars et responsables actifs enregistrés dans le département.
              </p>
            </article>

            <article className="rounded-3xl bg-emerald-50 p-5 text-emerald-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <CalendarCheck className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-emerald-700">
                Taux de présence
              </p>
              <p className="mt-1 text-4xl font-black">{attendanceRate}%</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-700">
                {attendanceCount} présence(s) sur {expectedAttendances} attendue(s).
              </p>
            </article>
          </div>

          <div className="grid gap-3 border-t border-[#DCEAF5] bg-[#F8FBFD] p-5 sm:grid-cols-3">
            <MetricCard
              title="Membres actifs"
              value={activeMembers}
              description="Affectations actives"
              icon={Users}
              accent="purple"
            />
            <MetricCard
              title="Présences enregistrées"
              value={attendanceCount}
              description="Participations uniques"
              icon={CalendarCheck}
              accent="green"
            />
            <MetricCard
              title="Moyenne par activité"
              value={averageAttendance}
              description="Membres présents"
              icon={TrendingUp}
              accent="blue"
            />
          </div>
        </section>

        <form
          action={saveDepartmentReportAction}
          className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="department_id" value={departmentId} />
          <input type="hidden" name="report_month" value={from} />

          {reportLocked && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Rapport validé : lecture seule. Toute modification, suppression ou nouvel envoi est désactivé.
            </div>
          )}

          <fieldset disabled={reportLocked} className="contents">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="font-bold text-[#03357A]">
              Début de période
              <input
                type="date"
                name="period_start"
                defaultValue={report?.period_start || from}
                className="filter-input mt-2 w-full"
              />
            </label>
            <label className="font-bold text-[#03357A]">
              Fin de période
              <input
                type="date"
                name="period_end"
                defaultValue={
                  report?.period_end ||
                  new Date(untilDate.getTime() - 86400000)
                    .toISOString()
                    .slice(0, 10)
                }
                className="filter-input mt-2 w-full"
              />
            </label>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="font-bold text-[#03357A]">
              Forces / points positifs
              <textarea
                name="strengths"
                defaultValue={report?.strengths || ""}
                className={`mt-2 ${field}`}
                placeholder="Réussites, ressources, bonnes pratiques…"
              />
            </label>
            <label className="font-bold text-[#03357A]">
              Faiblesses / difficultés
              <textarea
                name="weaknesses"
                defaultValue={report?.weaknesses || ""}
                className={`mt-2 ${field}`}
                placeholder="Difficultés rencontrées, besoins…"
              />
            </label>
            <label className="font-bold text-[#03357A]">
              Opportunités
              <textarea
                name="opportunities"
                defaultValue={report?.opportunities || ""}
                className={`mt-2 ${field}`}
                placeholder="Possibilités de croissance ou collaboration…"
              />
            </label>
            <label className="font-bold text-[#03357A]">
              Menaces / risques
              <textarea
                name="threats"
                defaultValue={report?.threats || ""}
                className={`mt-2 ${field}`}
                placeholder="Risques et obstacles à anticiper…"
              />
            </label>
            <label className="font-bold text-[#03357A] lg:col-span-2">
              Actions prévues le mois prochain
              <textarea
                name="next_actions"
                defaultValue={report?.next_actions || ""}
                className={`mt-2 ${field}`}
                placeholder="Priorités, responsables et échéances…"
              />
            </label>
          </div>

          <fieldset className="mt-5 rounded-2xl bg-[#F8FBFD] p-4">
            <legend className="px-2 font-black text-[#03357A]">
              Destinataires automatiques
            </legend>
            <p className="mb-3 text-sm leading-6 text-slate-500">
              À l’envoi, le rapport est automatiquement transmis aux Pasteurs
              titulaires, Pasteurs assistants, Administrateurs et Secrétaires
              actifs de cette église. Aucun choix manuel n’est nécessaire.
            </p>
            {recipients.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                Aucun destinataire officiel actif n’est actuellement configuré.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {recipients.map((recipient: any) => (
                  <div
                    key={recipient.id}
                    className="rounded-xl bg-white p-3 text-sm font-bold text-slate-700"
                  >
                    <span>{recipient.full_name || "Utilisateur"}</span>
                    <small className="ml-2 text-slate-400">
                      ({recipientRoleLabel(recipient.role)})
                    </small>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              name="intent"
              value="draft"
              className="rounded-2xl bg-[#EAF3FA] px-5 py-3 font-bold text-[#03357A]"
            >
              Enregistrer le brouillon
            </button>
            <button
              name="intent"
              value="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white"
            >
              <Send className="h-4 w-4" />
              Envoyer le rapport
            </button>
          </div>
          </fieldset>
        </form>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5">
          <h2 className="text-xl font-black text-[#03357A]">
            Rapports enregistrés
          </h2>

          <form
            method="get"
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
          >
            <input type="hidden" name="department" value={departmentId} />
            <select
              name="status"
              defaultValue={sp.status || ""}
              className="filter-input"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="submitted">Envoyés</option>
            </select>
            <input
              type="month"
              name="filterMonth"
              defaultValue={sp.filterMonth || ""}
              className="filter-input"
            />
            <button className="rounded-2xl bg-[#03357A] px-4 text-sm font-bold text-white">
              Filtrer
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {(reports || [])
              .filter(
                (item: any) =>
                  (!sp.status || item.status === sp.status) &&
                  (!sp.filterMonth ||
                    String(item.report_month).slice(0, 7) === sp.filterMonth)
              )
              .map((item: any) => {
                const editable =
                  !item.validated_at &&
                  item.edit_until &&
                  new Date(item.edit_until) > new Date();

                return (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#DCEAF5] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-black text-[#03357A]">
                        {item.departments?.name || "Département"} — {formatMonth(item.report_month)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.status === "submitted" ? "Envoyé" : "Brouillon"}
                        {item.status === "submitted"
                          ? item.validated_at
                            ? " · validé"
                            : " · en attente de validation"
                          : ""}
                        {` · modification ${editable ? "encore autorisée" : "clôturée"}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.validated_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Validé
                        </span>
                      )}
                      <Link
                        href={`/reports/departments?department=${item.department_id}&month=${String(
                          item.report_month
                        ).slice(0, 7)}&report=${item.id}`}
                        className="rounded-xl bg-[#EAF3FA] p-3 text-[#03357A]"
                        title={editable ? "Voir/modifier" : "Voir"}
                      >
                        {editable ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Link>

                      <a
                        href={`/api/reports/departments/${item.id}/pdf`}
                        className="rounded-xl bg-red-50 p-3 text-red-700"
                        title="Télécharger PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>

                      {editable && (
                        <form action={deleteDepartmentReportAction}>
                          <input type="hidden" name="report_id" value={item.id} />
                          <button
                            className="rounded-xl bg-red-50 p-3 text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
