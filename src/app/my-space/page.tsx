import Link from "next/link";
import { CalendarDays, HeartHandshake, ListTree, Settings, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function MySpacePage() {
  const { admin, profile } = await requireChurchModuleAccess("member_portal");
  const { data: linkedProfile } = await admin.from("profiles").select("member_id").eq("church_id", profile.church_id).eq("id", profile.id).maybeSingle();
  const memberId = linkedProfile?.member_id;

  if (!memberId) {
    return <AppShell><div className="mx-auto max-w-3xl space-y-6"><section className="rounded-[1.75rem] bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] p-6 text-white"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">Mon espace</p><h1 className="mt-2 text-3xl font-black">Compte à relier au dossier membre</h1><p className="mt-3 text-sm leading-7 text-blue-50">Votre compte est actif, mais il n’est pas encore associé à une fiche membre. Demandez à l’administrateur de sélectionner votre dossier dans la gestion des demandes de comptes.</p></section><Link href="/profile" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white"><Settings className="h-4 w-4" /> Gérer mon profil</Link></div></AppShell>;
  }

  const [memberResult, householdLinkResult, groupLinksResult, flowEntriesResult, assignmentsResult] = await Promise.all([
    admin.from("members").select("id,first_name,last_name,phone,email,photo_url,discipleship_stage,status").eq("church_id", profile.church_id).eq("id", memberId).maybeSingle(),
    admin.from("household_members").select("household_id,relationship").eq("church_id", profile.church_id).eq("member_id", memberId).maybeSingle(),
    admin.from("ministry_group_members").select("group_id,member_role,status").eq("church_id", profile.church_id).eq("member_id", memberId).neq("status", "left"),
    admin.from("people_flow_entries").select("id,flow_id,current_step_id,status,next_action_at").eq("church_id", profile.church_id).eq("member_id", memberId).in("status", ["active", "paused"]),
    admin.from("service_assignments").select("service_plan_id,position_id,status").eq("church_id", profile.church_id).eq("member_id", memberId).in("status", ["pending", "confirmed"]),
  ]);
  const member = memberResult.data;
  const groupLinks = groupLinksResult.data || [];
  const flowEntries = flowEntriesResult.data || [];
  const assignments = assignmentsResult.data || [];
  const groupIds = groupLinks.map((item) => item.group_id);
  const flowIds = flowEntries.map((item) => item.flow_id);
  const stepIds = flowEntries.map((item) => item.current_step_id).filter(Boolean) as string[];
  const planIds = assignments.map((item) => item.service_plan_id);
  const positionIds = assignments.map((item) => item.position_id);
  const householdId = householdLinkResult.data?.household_id;
  const emptyUuid = "00000000-0000-0000-0000-000000000000";

  const [groupsResult, flowsResult, stepsResult, plansResult, positionsResult, householdResult, familyLinksResult] = await Promise.all([
    admin.from("ministry_groups").select("id,name,meeting_day,meeting_time,meeting_location").eq("church_id", profile.church_id).in("id", groupIds.length ? groupIds : [emptyUuid]),
    admin.from("people_flows").select("id,name").eq("church_id", profile.church_id).in("id", flowIds.length ? flowIds : [emptyUuid]),
    admin.from("people_flow_steps").select("id,name").eq("church_id", profile.church_id).in("id", stepIds.length ? stepIds : [emptyUuid]),
    admin.from("service_plans").select("id,title,starts_at,location,status").eq("church_id", profile.church_id).in("id", planIds.length ? planIds : [emptyUuid]).gte("starts_at", new Date().toISOString()).order("starts_at"),
    admin.from("service_positions").select("id,name").eq("church_id", profile.church_id).in("id", positionIds.length ? positionIds : [emptyUuid]),
    householdId ? admin.from("church_households").select("id,name,address,city").eq("church_id", profile.church_id).eq("id", householdId).maybeSingle() : Promise.resolve({ data: null }),
    householdId ? admin.from("household_members").select("member_id,relationship").eq("church_id", profile.church_id).eq("household_id", householdId) : Promise.resolve({ data: [] }),
  ]);
  const familyLinks = familyLinksResult.data || [];
  const familyIds = familyLinks.map((item) => item.member_id);
  const { data: familyMembers } = await admin.from("members").select("id,first_name,last_name").eq("church_id", profile.church_id).in("id", familyIds.length ? familyIds : [emptyUuid]);
  const groups = new Map((groupsResult.data || []).map((item) => [item.id, item]));
  const flows = new Map((flowsResult.data || []).map((item) => [item.id, item.name]));
  const steps = new Map((stepsResult.data || []).map((item) => [item.id, item.name]));
  const plans = new Map((plansResult.data || []).map((item) => [item.id, item]));
  const positions = new Map((positionsResult.data || []).map((item) => [item.id, item.name]));
  const familyNames = new Map((familyMembers || []).map((item) => [item.id, `${item.first_name || ""} ${item.last_name || ""}`.trim()]));
  const firstName = member?.first_name || profile.full_name?.split(" ")[0] || "Bienvenue";

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <section className="rounded-[1.75rem] bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] p-5 text-white shadow-xl shadow-blue-950/15 sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">Mon espace membre</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Bonjour {firstName}</h1><p className="mt-2 text-sm leading-7 text-blue-50">Retrouvez votre foyer, vos groupes, votre accompagnement et vos prochains services.</p></div><Link href="/profile" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#1E3A8A]"><Settings className="h-4 w-4" /> Mon profil</Link></div></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Mon foyer" value={householdResult.data ? 1 : 0} description={householdResult.data?.name || "Non renseigné"} icon={HeartHandshake} accent="purple" /><MetricCard title="Mes groupes" value={groupLinks.length} description="Cellules et ministères" icon={UsersRound} accent="green" /><MetricCard title="Mes parcours" value={flowEntries.length} description="Accompagnements actifs" icon={ListTree} accent="blue" /><MetricCard title="Mes services" value={plansResult.data?.length || 0} description="Rendez-vous à venir" icon={CalendarDays} accent="orange" /></section>
    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Mon foyer</h2>{householdResult.data ? <><p className="mt-2 text-sm font-bold text-slate-700">{householdResult.data.name}</p><p className="mt-1 text-sm text-slate-500">{[householdResult.data.address, householdResult.data.city].filter(Boolean).join(", ") || "Adresse non renseignée"}</p><div className="mt-4 flex flex-wrap gap-2">{familyLinks.map((link) => <span key={link.member_id} className="rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-800">{familyNames.get(link.member_id) || "Membre"} · {link.relationship}</span>)}</div></> : <p className="mt-3 text-sm text-slate-500">Aucun foyer n’est encore associé à votre dossier.</p>}</article>
      <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Mes groupes</h2><div className="mt-4 space-y-3">{groupLinks.length === 0 ? <p className="text-sm text-slate-500">Vous n’êtes rattaché à aucun groupe.</p> : groupLinks.map((link) => { const group = groups.get(link.group_id); return <div key={link.group_id} className="rounded-2xl bg-emerald-50 p-4"><p className="font-black text-emerald-900">{group?.name || "Groupe"}</p><p className="mt-1 text-xs font-semibold text-emerald-700">{link.member_role} · {group?.meeting_location || "Lieu à définir"}</p></div>; })}</div></article>
      <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Mes parcours</h2><div className="mt-4 space-y-3">{flowEntries.length === 0 ? <p className="text-sm text-slate-500">Aucun parcours actif.</p> : flowEntries.map((entry) => <div key={entry.id} className="rounded-2xl bg-violet-50 p-4"><p className="font-black text-violet-900">{flows.get(entry.flow_id) || "Parcours"}</p><p className="mt-1 text-xs font-semibold text-violet-700">Étape : {steps.get(entry.current_step_id || "") || "À définir"}{entry.next_action_at ? ` · prochaine action ${formatDate(entry.next_action_at)}` : ""}</p></div>)}</div></article>
      <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Mes prochains services</h2><div className="mt-4 space-y-3">{assignments.length === 0 ? <p className="text-sm text-slate-500">Aucun service planifié.</p> : assignments.map((assignment) => { const plan = plans.get(assignment.service_plan_id); if (!plan) return null; return <div key={`${assignment.service_plan_id}-${assignment.position_id}`} className="rounded-2xl bg-blue-50 p-4"><p className="font-black text-blue-900">{plan.title}</p><p className="mt-1 text-xs font-semibold text-blue-700">{positions.get(assignment.position_id) || "Équipe"} · {formatDate(plan.starts_at)} · {assignment.status}</p></div>; })}</div></article>
    </section>
  </div></AppShell>;
}
