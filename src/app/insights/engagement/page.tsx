import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck2, CircleDollarSign, ClipboardCheck, HouseHeart, ListChecks, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

const pct = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))} %`;

function ProgressRow({ label, value, detail, href }: { label: string; value: number; detail: string; href: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return <Link href={href} className="block rounded-2xl border border-[#E5EDF4] p-4 transition hover:border-blue-300 hover:bg-blue-50/30"><div className="flex items-center justify-between gap-4"><div><p className="font-black text-[#03357A]">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div><span className="text-lg font-black text-[#2563EB]">{safe} %</span></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${safe}%` }} /></div></Link>;
}

export default async function EngagementInsightsPage() {
  const { admin, profile } = await requireChurchModuleAccess("engagement_insights");
  const churchId = profile.church_id; const now = new Date(); const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const [members, groupMembers, flows, plans, positions, assignments, householdMembers, pledges, submissions, attendances] = await Promise.all([
    admin.from("members").select("id", { count: "exact" }).eq("church_id", churchId).is("archived_at", null),
    admin.from("ministry_group_members").select("member_id").eq("church_id", churchId).eq("status", "active"),
    admin.from("people_flow_entries").select("id,next_action_at,status").eq("church_id", churchId).in("status", ["active", "paused"]),
    admin.from("service_plans").select("id").eq("church_id", churchId).gte("starts_at", now.toISOString()).neq("status", "cancelled").limit(100),
    admin.from("service_positions").select("service_plan_id,required_count").eq("church_id", churchId),
    admin.from("service_assignments").select("service_plan_id,status").eq("church_id", churchId).in("status", ["pending", "confirmed", "checked_in"]),
    admin.from("household_members").select("member_id").eq("church_id", churchId),
    admin.from("giving_pledges").select("pledged_amount,paid_amount,status").eq("church_id", churchId).neq("status", "cancelled"),
    admin.from("church_form_submissions").select("id,status,created_at").eq("church_id", churchId).gte("created_at", thirtyDaysAgo),
    admin.from("event_attendances").select("member_id,check_in_at").eq("church_id", churchId).gte("check_in_at", thirtyDaysAgo),
  ]);
  const memberCount = members.count ?? members.data?.length ?? 0;
  const groupUnique = new Set((groupMembers.data || []).map((item: any) => item.member_id)).size;
  const householdUnique = new Set((householdMembers.data || []).map((item: any) => item.member_id)).size;
  const attendanceUnique = new Set((attendances.data || []).map((item: any) => item.member_id).filter(Boolean)).size;
  const overdueFlows = (flows.data || []).filter((item: any) => item.status === "active" && item.next_action_at && new Date(item.next_action_at) < now).length;
  const planIds = new Set((plans.data || []).map((item: any) => item.id));
  const requiredPositions = (positions.data || []).filter((item: any) => planIds.has(item.service_plan_id)).reduce((sum: number, item: any) => sum + Number(item.required_count || 0), 0);
  const filledPositions = (assignments.data || []).filter((item: any) => planIds.has(item.service_plan_id)).length;
  const pledged = (pledges.data || []).reduce((sum: number, item: any) => sum + Number(item.pledged_amount || 0), 0);
  const paid = (pledges.data || []).reduce((sum: number, item: any) => sum + Number(item.paid_amount || 0), 0);
  const formTotal = submissions.data?.length || 0; const formProcessed = (submissions.data || []).filter((item: any) => item.status !== "new").length;
  const groupRate = memberCount ? (groupUnique / memberCount) * 100 : 0; const householdRate = memberCount ? (householdUnique / memberCount) * 100 : 0; const attendanceRate = memberCount ? (attendanceUnique / memberCount) * 100 : 0; const staffingRate = requiredPositions ? (filledPositions / requiredPositions) * 100 : 100; const pledgeRate = pledged ? (paid / pledged) * 100 : 100; const processingRate = formTotal ? (formProcessed / formTotal) * 100 : 100;
  const engagementScore = Math.round(groupRate * .25 + householdRate * .15 + attendanceRate * .25 + staffingRate * .15 + pledgeRate * .1 + processingRate * .1);
  const initError = pledges.error || submissions.error;

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <section className="rounded-[1.75rem] bg-gradient-to-br from-[#0F3D5E] via-[#0369A1] to-[#06B6D4] p-5 text-white shadow-xl shadow-sky-950/15 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><BarChart3 className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-100">Décisions pastorales</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Pilotage de l’engagement</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-sky-50">Une vue claire des personnes accompagnées, des équipes à compléter et des actions qui demandent une attention immédiate.</p></div></div></section>
    {initError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Les nouveaux indicateurs financiers et formulaires seront disponibles dès la fin de l’initialisation Phase 3.</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Score d’engagement" value={pct(engagementScore)} description="Synthèse de 6 indicateurs" icon={BarChart3} accent="blue" /><MetricCard title="Actifs en groupe" value={groupUnique} description={`${pct(groupRate)} des membres`} icon={UsersRound} accent="green" /><MetricCard title="Présents sur 30 jours" value={attendanceUnique} description={`${pct(attendanceRate)} des membres`} icon={CalendarCheck2} accent="purple" /><MetricCard title="Suivis en retard" value={overdueFlows} description="Actions pastorales échues" icon={ListChecks} accent="orange" /></section>
    <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-black text-[#03357A]">Couverture des parcours clés</h2><div className="mt-5 space-y-3"><ProgressRow label="Participation aux groupes" value={groupRate} detail={`${groupUnique} membres rattachés à une cellule ou un groupe actif`} href="/groups" /><ProgressRow label="Couverture familiale" value={householdRate} detail={`${householdUnique} membres rattachés à un foyer`} href="/families" /><ProgressRow label="Présence récente" value={attendanceRate} detail={`${attendanceUnique} membres distincts enregistrés sur 30 jours`} href="/attendance" /><ProgressRow label="Équipes des prochains cultes" value={staffingRate} detail={`${filledPositions} affectation(s) pour ${requiredPositions} besoin(s)`} href="/services" /><ProgressRow label="Promesses honorées" value={pledgeRate} detail={`${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(paid)} versés sur ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(pledged)} promis`} href="/finance/campaigns" /><ProgressRow label="Réponses traitées" value={processingRate} detail={`${formProcessed} réponse(s) traitée(s) sur ${formTotal} reçue(s) ce mois`} href="/forms" /></div></div>
      <aside className="space-y-4"><div className="rounded-3xl bg-[#03357A] p-6 text-white"><h2 className="text-xl font-black">Priorités suggérées</h2><div className="mt-5 space-y-3">{overdueFlows > 0 && <Link href="/people-flows" className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-bold"><span>Relancer {overdueFlows} suivi(s) en retard</span><ArrowRight className="h-4 w-4" /></Link>}{requiredPositions > filledPositions && <Link href="/services" className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-bold"><span>Compléter {requiredPositions - filledPositions} poste(s)</span><ArrowRight className="h-4 w-4" /></Link>}{formTotal - formProcessed > 0 && <Link href="/forms" className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-bold"><span>Traiter {formTotal - formProcessed} nouvelle(s) réponse(s)</span><ArrowRight className="h-4 w-4" /></Link>}{overdueFlows === 0 && requiredPositions <= filledPositions && formTotal === formProcessed && <p className="rounded-2xl bg-emerald-400/20 p-4 text-sm font-bold">Aucune urgence détectée sur les indicateurs disponibles.</p>}</div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Link href="/families" className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4 font-black text-[#03357A]"><HouseHeart className="h-5 w-5 text-emerald-600" />Améliorer les foyers</Link><Link href="/finance/campaigns" className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4 font-black text-[#03357A]"><CircleDollarSign className="h-5 w-5 text-amber-600" />Suivre les promesses</Link><Link href="/forms" className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-white p-4 font-black text-[#03357A]"><ClipboardCheck className="h-5 w-5 text-violet-600" />Voir les inscriptions</Link></div></aside>
    </section>
  </div></AppShell>;
}
