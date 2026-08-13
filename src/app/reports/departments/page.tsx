import Link from "next/link";
import { Activity, ArrowLeft, CalendarCheck, Star, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";
import { saveDepartmentReportAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ department?: string; month?: string; saved?: string; error?: string }> };
const field = "min-h-32 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

export default async function DepartmentReportsPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const context = await getCurrentSecurityContext();
  if (!context.churchId) return null;
  const admin = createAdminClient();
  const month = /^\d{4}-\d{2}$/.test(sp.month || "") ? sp.month! : new Date().toISOString().slice(0, 7);
  const from = `${month}-01`;
  const untilDate = new Date(`${from}T00:00:00Z`); untilDate.setUTCMonth(untilDate.getUTCMonth() + 1);
  const until = untilDate.toISOString().slice(0, 10);

  let allowedDepartmentIds: string[] | null = null;
  if (context.role === "responsable_d") {
    const { data: member } = context.email ? await admin.from("members").select("id").eq("church_id", context.churchId).ilike("email", context.email).maybeSingle() : { data: null };
    const { data: links } = member ? await admin.from("member_departments").select("department_id,role").eq("church_id", context.churchId).eq("member_id", member.id) : { data: [] as any[] };
    allowedDepartmentIds = (links || []).filter((link: any) => ["leader", "responsable", "manager", "responsable_d", "department_leader"].includes(String(link.role || "").toLowerCase())).map((link: any) => link.department_id);
  }
  let departmentsQuery = admin.from("departments").select("id,name").eq("church_id", context.churchId).eq("status", "active").order("name");
  if (allowedDepartmentIds) departmentsQuery = departmentsQuery.in("id", allowedDepartmentIds.length ? allowedDepartmentIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: departments } = await departmentsQuery;
  const departmentId = departments?.some((d: any) => d.id === sp.department) ? sp.department! : departments?.[0]?.id;
  if (!departmentId) return <AppShell><p className="rounded-3xl bg-white p-6">Créez d’abord un département actif.</p></AppShell>;

  const [{ data: assignments }, { data: events }, { data: report }] = await Promise.all([
    admin.from("member_departments").select("member_id,role,status,members(status)").eq("church_id", context.churchId).eq("department_id", departmentId),
    admin.from("events").select("id,event_date").eq("church_id", context.churchId).gte("event_date", from).lt("event_date", until),
    admin.from("department_monthly_reports").select("*").eq("church_id", context.churchId).eq("department_id", departmentId).eq("report_month", from).maybeSingle(),
  ]);
  const memberIds = (assignments || []).map((a: any) => a.member_id).filter(Boolean);
  const eventIds = (events || []).map((e: any) => e.id);
  const { data: attendances } = memberIds.length && eventIds.length
    ? await admin.from("event_attendances").select("member_id,event_id").eq("church_id", context.churchId).in("member_id", memberIds).in("event_id", eventIds)
    : { data: [] as any[] };
  const activeMembers = (assignments || []).filter((a: any) => a.status === "active" && (!a.members?.status || ["active", "actif"].includes(a.members.status))).length;
  const leaders = (assignments || []).filter((a: any) => ["leader", "responsable", "manager", "responsable_d", "department_leader"].includes(String(a.role || "").toLowerCase())).length;
  const representedActivities = new Set((attendances || []).map((a: any) => a.event_id)).size;
  const averageAttendance = representedActivities ? Math.round((attendances?.length || 0) / representedActivities) : 0;

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <Link href="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"><ArrowLeft className="h-4 w-4"/>Retour aux rapports</Link>
    <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white"><p className="text-xs font-black uppercase tracking-[.25em] text-blue-100">Pilotage mensuel</p><h1 className="mt-3 text-3xl font-black">Rapport du département</h1><p className="mt-2 text-sm text-blue-50">Les chiffres sont calculés automatiquement depuis les membres, événements et présences enregistrés.</p></section>
    <form method="get" className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 sm:grid-cols-[1fr_180px_auto]">
      <select name="department" defaultValue={departmentId} className="h-12 rounded-2xl border border-[#DCEAF5] px-4 font-bold text-[#03357A]">{departments?.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <input type="month" name="month" defaultValue={month} className="h-12 rounded-2xl border border-[#DCEAF5] px-4" />
      <button className="rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white">Afficher</button>
    </form>
    {sp.saved && <p className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-700">Rapport enregistré.</p>}{sp.error && <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">Impossible d’enregistrer le rapport. Vérifiez que la migration Supabase a été exécutée.</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Activités réalisées" value={representedActivities} description="Activités avec présence du département" icon={Activity} accent="blue" />
      <MetricCard title="Présence moyenne" value={averageAttendance} description="Membres présents par activité" icon={CalendarCheck} accent="green" />
      <MetricCard title="Membres actifs" value={activeMembers} description="Affectations actives" icon={Users} accent="purple" />
      <MetricCard title="Responsables" value={leaders} description="Leaders enregistrés dans la base" icon={Star} accent="orange" />
    </section>
    <form action={saveDepartmentReportAction} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <input type="hidden" name="department_id" value={departmentId}/><input type="hidden" name="report_month" value={from}/>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="font-bold text-[#03357A]">Forces / points positifs<textarea name="strengths" defaultValue={report?.strengths || ""} className={`mt-2 ${field}`} placeholder="Réussites, ressources, bonnes pratiques…"/></label>
        <label className="font-bold text-[#03357A]">Faiblesses / difficultés<textarea name="weaknesses" defaultValue={report?.weaknesses || ""} className={`mt-2 ${field}`} placeholder="Difficultés rencontrées, besoins…"/></label>
        <label className="font-bold text-[#03357A]">Opportunités<textarea name="opportunities" defaultValue={report?.opportunities || ""} className={`mt-2 ${field}`} placeholder="Possibilités de croissance ou collaboration…"/></label>
        <label className="font-bold text-[#03357A]">Menaces / risques<textarea name="threats" defaultValue={report?.threats || ""} className={`mt-2 ${field}`} placeholder="Risques et obstacles à anticiper…"/></label>
        <label className="font-bold text-[#03357A] lg:col-span-2">Actions prévues le mois prochain<textarea name="next_actions" defaultValue={report?.next_actions || ""} className={`mt-2 ${field}`} placeholder="Priorités, responsables et échéances…"/></label>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end"><button name="intent" value="draft" className="rounded-2xl bg-[#EAF3FA] px-5 py-3 font-bold text-[#03357A]">Enregistrer le brouillon</button><button name="intent" value="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 font-bold text-white">Soumettre le rapport</button></div>
    </form>
  </div></AppShell>;
}
