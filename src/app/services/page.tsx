import { CalendarDays, CheckCircle2, MapPin, UserCheck, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { addServicePositionAction, assignServiceVolunteerAction, createServicePlanAction } from "./actions";

type Query = Promise<{ saved?: string; error?: string }>;
type Plan = { id: string; title: string; service_type: string; starts_at: string; location: string | null; status: string };
type Position = { id: string; service_plan_id: string; name: string; required_count: number; position: number };
type Assignment = { position_id: string; member_id: string; status: string };
const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100";

function memberName(member: { first_name: string | null; last_name: string | null }) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre sans nom";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function ServicesPage({ searchParams }: { searchParams?: Query }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("services");
  const churchId = profile.church_id;
  const [plansResult, positionsResult, assignmentsResult, membersResult] = await Promise.all([
    admin.from("service_plans").select("id,title,service_type,starts_at,location,status").eq("church_id", churchId).neq("status", "cancelled").order("starts_at", { ascending: true }).limit(60),
    admin.from("service_positions").select("id,service_plan_id,name,required_count,position").eq("church_id", churchId).order("position"),
    admin.from("service_assignments").select("position_id,member_id,status").eq("church_id", churchId),
    admin.from("members").select("id,first_name,last_name").eq("church_id", churchId).is("archived_at", null).order("last_name").limit(1000),
  ]);
  const plans = (plansResult.data || []) as Plan[];
  const positions = (positionsResult.data || []) as Position[];
  const assignments = (assignmentsResult.data || []) as Assignment[];
  const members = membersResult.data || [];
  const memberNames = new Map(members.map((member) => [member.id, memberName(member)]));
  const now = new Date();
  const upcomingPlans = plans.filter((plan) => new Date(plan.starts_at) >= now && plan.status !== "completed");
  const required = positions.reduce((sum, position) => sum + position.required_count, 0);
  const confirmed = assignments.filter((assignment) => ["confirmed", "checked_in"].includes(assignment.status)).length;
  const loadError = plansResult.error || positionsResult.error || assignmentsResult.error;

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#0F3D75] via-[#2563EB] to-[#06B6D4] p-5 text-white shadow-xl shadow-blue-950/15 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><CalendarDays className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">Organisation des équipes</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Cultes et bénévoles</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Préparez chaque rendez-vous, visualisez les postes à couvrir et confirmez les personnes qui servent.</p></div></div></section>
        {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Planning mis à jour avec succès.</div>}
        {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Impossible d’effectuer cette opération. Vérifiez la date, le poste et le bénévole.</div>}
        {loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le module doit encore être initialisé dans la base de données : {loadError.message}</div>}

        <section className="grid gap-4 sm:grid-cols-3"><MetricCard title="Prochains rendez-vous" value={upcomingPlans.length} description="Cultes et activités planifiés" icon={CalendarDays} accent="blue" /><MetricCard title="Postes nécessaires" value={required} description="Sur les plannings affichés" icon={UsersRound} accent="purple" /><MetricCard title="Bénévoles confirmés" value={confirmed} description={`${Math.max(0, required - confirmed)} place(s) à couvrir`} icon={UserCheck} accent="green" /></section>

        {permissions.can_create && <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-black text-[#03357A]">Planifier un rendez-vous</h2><form action={createServicePlanAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><input name="title" required maxLength={140} placeholder="Ex : Culte du dimanche" className={inputClass} /><select name="service_type" defaultValue="culte" className={inputClass}><option value="culte">Culte</option><option value="priere">Prière</option><option value="conference">Conférence</option><option value="jeunesse">Jeunesse</option><option value="repetition">Répétition</option><option value="autre">Autre</option></select><input name="starts_at" type="datetime-local" required className={inputClass} /><input name="location" maxLength={180} placeholder="Lieu" className={inputClass} /><input name="first_position" required maxLength={100} placeholder="Premier poste (ex : Accueil)" className={inputClass} /><input name="required_count" type="number" min="1" max="500" defaultValue="1" aria-label="Nombre de bénévoles" className={inputClass} /><input name="notes" maxLength={1500} placeholder="Consignes" className={`${inputClass} md:col-span-2`} /><ActionSubmitButton pendingLabel="Publication…" className="min-h-12 rounded-2xl bg-[#2563EB] px-5 text-sm font-black text-white disabled:opacity-60 md:col-span-2 xl:col-span-4">Publier le planning</ActionSubmitButton></form></section>}

        <section className="grid gap-4 xl:grid-cols-2">
          {upcomingPlans.length === 0 && !loadError && <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">Aucun culte à venir. Planifiez le prochain rendez-vous ci-dessus.</div>}
          {upcomingPlans.map((plan) => {
            const planPositions = positions.filter((position) => position.service_plan_id === plan.id);
            return <article key={plan.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{plan.service_type}</p><h2 className="mt-1 text-xl font-black text-[#03357A]">{plan.title}</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{plan.status}</span></div><div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" />{formatDate(plan.starts_at)}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />{plan.location || "Lieu à définir"}</p></div><div className="mt-5 space-y-3">{planPositions.map((position) => {
              const positionAssignments = assignments.filter((assignment) => assignment.position_id === position.id && assignment.status !== "declined");
              return <div key={position.id} className="rounded-2xl bg-[#F8FAFC] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-800">{position.name}</p><span className={`rounded-full px-3 py-1 text-xs font-black ${positionAssignments.length >= position.required_count ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{positionAssignments.length} / {position.required_count}</span></div>{positionAssignments.length > 0 && <p className="mt-2 text-xs font-semibold text-slate-500">{positionAssignments.map((assignment) => memberNames.get(assignment.member_id) || "Bénévole").join(" · ")}</p>}{permissions.can_update && members.length > 0 && <form action={assignServiceVolunteerAction} className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="service_plan_id" value={plan.id} /><input type="hidden" name="position_id" value={position.id} /><select name="member_id" required defaultValue="" className={inputClass}><option value="" disabled>Affecter un bénévole…</option>{members.map((member) => <option key={member.id} value={member.id}>{memberName(member)}</option>)}</select><ActionSubmitButton pendingLabel="Affectation…" className="min-h-12 shrink-0 rounded-2xl bg-[#03357A] px-4 text-xs font-black text-white disabled:opacity-60">Confirmer</ActionSubmitButton></form>}</div>;
            })}</div>{permissions.can_update && <form action={addServicePositionAction} className="mt-4 flex flex-col gap-2 border-t border-[#E8F0F6] pt-4 sm:flex-row"><input type="hidden" name="service_plan_id" value={plan.id} /><input name="name" required maxLength={100} placeholder="Ajouter un poste…" className={inputClass} /><input name="required_count" type="number" min="1" max="500" defaultValue="1" aria-label="Nombre requis" className={`${inputClass} sm:max-w-28`} /><ActionSubmitButton pendingLabel="Ajout…" className="min-h-12 shrink-0 rounded-2xl bg-blue-100 px-4 text-xs font-black text-blue-800 disabled:opacity-60">Ajouter</ActionSubmitButton></form>}<div className="mt-4 flex items-center gap-2 border-t border-[#E8F0F6] pt-4 text-xs font-bold text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Le planning affiche immédiatement les postes encore non couverts.</div></article>;
          })}
        </section>
      </div>
    </AppShell>
  );
}
