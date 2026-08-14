import Link from "next/link";
import { Activity, ArrowLeft, CalendarCheck, Eye, Pencil, Send, Star, Trash2, TrendingUp, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { deleteDepartmentReportAction, saveDepartmentReportAction } from "./actions";
import { getProfileDepartmentIds } from "@/lib/security/departmentScope";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ department?: string; month?: string; report?: string; status?: string; filterMonth?: string; received?: string; saved?: string; deleted?: string; error?: string }> };
const field = "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function DepartmentReportsPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const context = await getCurrentSecurityContext();
  if (!context.churchId) return null;
  const admin = createAdminClient();
  if (sp.received === "1") {
    const { data: currentProfile } = await admin.from("profiles").select("id").eq("user_id", context.userId).eq("church_id", context.churchId).maybeSingle();
    if (currentProfile) await admin.from("department_report_recipients").update({ read_at: new Date().toISOString() }).eq("church_id", context.churchId).eq("profile_id", currentProfile.id).is("read_at", null);
  }
  const month = /^\d{4}-\d{2}$/.test(sp.month || "") ? sp.month! : new Date().toISOString().slice(0, 7);
  const from = `${month}-01`;
  const untilDate = new Date(`${from}T00:00:00Z`); untilDate.setUTCMonth(untilDate.getUTCMonth() + 1);
  const until = untilDate.toISOString().slice(0, 10);

  let allowedDepartmentIds: string[] | null = null;
  if (context.role === "responsable_d") {
    allowedDepartmentIds = await getProfileDepartmentIds({ userId: context.userId, churchId: context.churchId, email: context.email });
  }
  let departmentsQuery = admin.from("departments").select("id,name").eq("church_id", context.churchId).eq("status", "active").order("name");
  if (allowedDepartmentIds) departmentsQuery = departmentsQuery.in("id", allowedDepartmentIds.length ? allowedDepartmentIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: departments } = await departmentsQuery;
  const departmentId = departments?.some((d: any) => d.id === sp.department) ? sp.department! : departments?.[0]?.id;
  if (!departmentId) return <AppShell><p className="rounded-3xl bg-white p-6">Créez d’abord un département actif.</p></AppShell>;

  const [{ data: assignments }, { data: events }, { data: selectedReport }, { data: reports }, { data: recipients }] = await Promise.all([
    admin.from("member_departments").select("member_id,role,status,members(status)").eq("church_id", context.churchId).eq("department_id", departmentId),
    admin.from("events").select("id,event_date").eq("church_id", context.churchId).gte("event_date", from).lt("event_date", until),
    sp.report ? admin.from("department_monthly_reports").select("*").eq("church_id", context.churchId).eq("department_id", departmentId).eq("id", sp.report).maybeSingle() : admin.from("department_monthly_reports").select("*").eq("church_id", context.churchId).eq("department_id", departmentId).eq("report_month", from).maybeSingle(),
    admin.from("department_monthly_reports").select("id,department_id,report_month,period_start,period_end,status,edit_until,sent_at,departments(name)").eq("church_id", context.churchId).eq("department_id", departmentId).order("report_month", { ascending: false }).limit(36),
    admin.from("profiles").select("id,full_name,role").eq("church_id", context.churchId).eq("status", "active").in("role", ["church_admin", "admin", "pasteur_t", "pastor", "pastor_titulaire"]).order("full_name"),
  ]);
  const report = selectedReport;
  const activeAssignments = (assignments || []).filter((assignment: any) => {
    const member = Array.isArray(assignment.members) ? assignment.members[0] : assignment.members;
    return assignment.status === "active" && (!member?.status || ["active", "actif"].includes(member.status));
  });
  const activeMemberIds = [...new Set(activeAssignments.map((assignment: any) => assignment.member_id).filter(Boolean))];
  const eventIds = (events || []).map((e: any) => e.id);
  const { data: attendances } = activeMemberIds.length && eventIds.length
    ? await admin.from("event_attendances").select("member_id,event_id").eq("church_id", context.churchId).in("member_id", activeMemberIds).in("event_id", eventIds)
    : { data: [] as any[] };
  const activeMembers = activeMemberIds.length;
  const leaders = new Set(activeAssignments
    .filter((assignment: any) => ["star", "leader", "responsable", "manager", "responsable_d", "department_leader"].includes(String(assignment.role || "").toLowerCase()))
    .map((assignment: any) => assignment.member_id)).size;
  const uniqueAttendances = new Set((attendances || []).map((attendance: any) => `${attendance.event_id}:${attendance.member_id}`));
  const representedActivities = new Set((attendances || []).map((attendance: any) => attendance.event_id)).size;
  const attendanceCount = uniqueAttendances.size;
  const averageAttendance = representedActivities ? Math.round(attendanceCount / representedActivities) : 0;
  const expectedAttendances = activeMembers * representedActivities;
  const attendanceRate = expectedAttendances ? Math.min(100, Math.round((attendanceCount / expectedAttendances) * 100)) : 0;
  const reportedMonths = new Set((reports || []).filter((r: any) => r.department_id === departmentId).map((r: any) => String(r.report_month).slice(0, 7)));
  const missingMonths = Array.from({ length: 12 }, (_, index) => { const d = new Date(); d.setMonth(d.getMonth() - index); return d.toISOString().slice(0, 7); }).filter((m) => !reportedMonths.has(m));

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <Link href="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"><ArrowLeft className="h-4 w-4"/>Retour aux rapports</Link>
    <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white"><p className="text-xs font-black uppercase tracking-[.25em] text-blue-100">Pilotage mensuel</p><h1 className="mt-3 text-3xl font-black">Rapport du département</h1><p className="mt-2 text-sm text-blue-50">Les chiffres sont calculés automatiquement depuis les membres, événements et présences enregistrés.</p></section>
    <form method="get" className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 sm:grid-cols-[1fr_180px_auto]">
      <select name="department" defaultValue={departmentId} className="h-12 rounded-2xl border border-[#DCEAF5] px-4 font-bold text-[#03357A]">{departments?.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <input type="month" name="month" defaultValue={month} className="h-12 rounded-2xl border border-[#DCEAF5] px-4" />
      <button className="rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white">Afficher</button>
    </form>
    {sp.saved && <p className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">Rapport enregistré.</p>}{sp.error && <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">Impossible d’enregistrer le rapport. Vérifiez que la migration Supabase a été exécutée.</p>}
    {missingMonths.length > 0 && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black text-amber-900">Mois sans rapport</h2><div className="mt-3 flex flex-wrap gap-2">{missingMonths.map((item)=><Link key={item} href={`/reports/departments?department=${departmentId}&month=${item}`} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-amber-800">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${item}-01`))}</Link>)}</div></section>}
    <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
      <div className="flex flex-col gap-3 bg-gradient-to-r from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-blue-100">Données récupérées automatiquement</p>
          <h2 className="mt-2 text-2xl font-black">Synthèse des activités</h2>
          <p className="mt-1 text-sm text-blue-50">Période du {new Intl.DateTimeFormat("fr-FR").format(new Date(`${from}T00:00:00`))} au {new Intl.DateTimeFormat("fr-FR").format(new Date(untilDate.getTime() - 86400000))}.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black ring-1 ring-white/20"><TrendingUp className="h-4 w-4"/>Mise à jour en temps réel</span>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <article className="rounded-3xl bg-blue-50 p-5 text-blue-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"><Activity className="h-6 w-6"/></span>
          <p className="mt-4 text-sm font-bold text-blue-700">Activités réalisées</p>
          <p className="mt-1 text-4xl font-black">{representedActivities}</p>
          <p className="mt-2 text-sm leading-6 text-blue-700">Activités de la période ayant au moins une présence enregistrée pour ce département.</p>
        </article>

        <article className="rounded-3xl bg-amber-50 p-5 text-amber-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm"><Star className="h-6 w-6"/></span>
          <p className="mt-4 text-sm font-bold text-amber-700">Nombre de stars</p>
          <p className="mt-1 text-4xl font-black">{leaders}</p>
          <p className="mt-2 text-sm leading-6 text-amber-700">Stars et responsables actifs enregistrés dans le département.</p>
        </article>

        <article className="rounded-3xl bg-emerald-50 p-5 text-emerald-900">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm"><CalendarCheck className="h-6 w-6"/></span>
          <p className="mt-4 text-sm font-bold text-emerald-700">Taux de présence</p>
          <p className="mt-1 text-4xl font-black">{attendanceRate}%</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${attendanceRate}%` }}/></div>
          <p className="mt-2 text-sm leading-6 text-emerald-700">{attendanceCount} présence(s) sur {expectedAttendances} attendue(s).</p>
        </article>
      </div>

      <div className="grid gap-3 border-t border-[#DCEAF5] bg-[#F8FBFD] p-5 sm:grid-cols-3">
        <MetricCard title="Membres actifs" value={activeMembers} description="Affectations actives" icon={Users} accent="purple" />
        <MetricCard title="Présences enregistrées" value={attendanceCount} description="Participations uniques" icon={CalendarCheck} accent="green" />
        <MetricCard title="Moyenne par activité" value={averageAttendance} description="Membres présents" icon={TrendingUp} accent="blue" />
      </div>
    </section>
    <form action={saveDepartmentReportAction} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <input type="hidden" name="department_id" value={departmentId}/><input type="hidden" name="report_month" value={from}/>
      <div className="mb-5 grid gap-4 sm:grid-cols-2"><label className="font-bold text-[#03357A]">Début de période<input type="date" name="period_start" defaultValue={report?.period_start || from} className="filter-input mt-2 w-full"/></label><label className="font-bold text-[#03357A]">Fin de période<input type="date" name="period_end" defaultValue={report?.period_end || new Date(untilDate.getTime()-86400000).toISOString().slice(0,10)} className="filter-input mt-2 w-full"/></label></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="font-bold text-[#03357A]">Forces / points positifs<textarea name="strengths" defaultValue={report?.strengths || ""} className={`mt-2 ${field}`} placeholder="Réussites, ressources, bonnes pratiques…"/></label>
        <label className="font-bold text-[#03357A]">Faiblesses / difficultés<textarea name="weaknesses" defaultValue={report?.weaknesses || ""} className={`mt-2 ${field}`} placeholder="Difficultés rencontrées, besoins…"/></label>
        <label className="font-bold text-[#03357A]">Opportunités<textarea name="opportunities" defaultValue={report?.opportunities || ""} className={`mt-2 ${field}`} placeholder="Possibilités de croissance ou collaboration…"/></label>
        <label className="font-bold text-[#03357A]">Menaces / risques<textarea name="threats" defaultValue={report?.threats || ""} className={`mt-2 ${field}`} placeholder="Risques et obstacles à anticiper…"/></label>
        <label className="font-bold text-[#03357A] lg:col-span-2">Actions prévues le mois prochain<textarea name="next_actions" defaultValue={report?.next_actions || ""} className={`mt-2 ${field}`} placeholder="Priorités, responsables et échéances…"/></label>
      </div>
      <fieldset className="mt-5 rounded-2xl bg-[#F8FBFD] p-4"><legend className="px-2 font-black text-[#03357A]">Destinataires internes</legend><p className="mb-3 text-sm text-slate-500">Seuls les pasteurs titulaires et administrateurs de cette église sont proposés.</p><div className="grid gap-2 sm:grid-cols-2">{(recipients || []).map((recipient:any)=><label key={recipient.id} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-700"><input type="checkbox" name="recipient_ids" value={recipient.id}/><span>{recipient.full_name || recipient.role} <small className="text-slate-400">({recipient.role})</small></span></label>)}</div></fieldset>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end"><button name="intent" value="draft" className="rounded-2xl bg-[#EAF3FA] px-5 py-3 font-bold text-[#03357A]">Enregistrer le brouillon</button><button name="intent" value="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white"><Send className="h-4 w-4"/>Envoyer le rapport</button></div>
    </form>
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5"><h2 className="text-xl font-black text-[#03357A]">Rapports enregistrés</h2><form method="get" className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]"><input type="hidden" name="department" value={departmentId}/><select name="status" defaultValue={sp.status || ""} className="filter-input"><option value="">Tous les statuts</option><option value="draft">Brouillons</option><option value="submitted">Envoyés</option></select><input type="month" name="filterMonth" defaultValue={sp.filterMonth || ""} className="filter-input"/><button className="rounded-2xl bg-[#03357A] px-4 text-sm font-bold text-white">Filtrer</button></form><div className="mt-4 space-y-3">{(reports || []).filter((r:any)=>(!sp.status || r.status===sp.status)&&(!sp.filterMonth || String(r.report_month).slice(0,7)===sp.filterMonth)).map((item:any)=>{const editable=item.edit_until && new Date(item.edit_until)>new Date();return <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-[#DCEAF5] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[#03357A]">{item.departments?.name || "Département"} — {String(item.report_month).slice(0,7)}</p><p className="text-sm text-slate-500">{item.status === "submitted" ? "Envoyé" : "Brouillon"} · modification {editable ? "encore autorisée" : "clôturée"}</p></div><div className="flex gap-2"><Link href={`/reports/departments?department=${item.department_id}&month=${String(item.report_month).slice(0,7)}&report=${item.id}`} className="rounded-xl bg-[#EAF3FA] p-3 text-[#03357A]" title={editable?"Voir/modifier":"Voir"}>{editable?<Pencil className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</Link>{editable&&<form action={deleteDepartmentReportAction}><input type="hidden" name="report_id" value={item.id}/><button className="rounded-xl bg-red-50 p-3 text-red-600" title="Supprimer"><Trash2 className="h-4 w-4"/></button></form>}</div></article>})}</div></section>
  </div></AppShell>;
}
