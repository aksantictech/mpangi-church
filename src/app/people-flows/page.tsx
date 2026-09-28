import { ArrowRight, CheckCircle2, Clock3, ListTree, UserPlus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { addPeopleFlowStepAction, advanceFlowEntryAction, createPeopleFlowAction, enrollFlowMemberAction } from "./actions";

type Query = Promise<{ saved?: string; error?: string }>;
type Flow = { id: string; name: string; description: string | null; trigger_type: string; status: string };
type Step = { id: string; flow_id: string; name: string; position: number; due_after_days: number };
type Entry = { id: string; flow_id: string; display_name: string | null; current_step_id: string | null; status: string; next_action_at: string | null };
const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-violet-100";

function memberName(member: { first_name: string | null; last_name: string | null }) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre sans nom";
}

function dueLabel(value: string | null) {
  if (!value) return "Sans échéance";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function PeopleFlowsPage({ searchParams }: { searchParams?: Query }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("people_flows");
  const churchId = profile.church_id;
  const [flowsResult, stepsResult, entriesResult, membersResult] = await Promise.all([
    admin.from("people_flows").select("id,name,description,trigger_type,status").eq("church_id", churchId).neq("status", "archived").order("created_at", { ascending: false }),
    admin.from("people_flow_steps").select("id,flow_id,name,position,due_after_days").eq("church_id", churchId).order("position"),
    admin.from("people_flow_entries").select("id,flow_id,display_name,current_step_id,status,next_action_at").eq("church_id", churchId).in("status", ["active", "paused"]).order("next_action_at"),
    admin.from("members").select("id,first_name,last_name").eq("church_id", churchId).is("archived_at", null).order("last_name").limit(1000),
  ]);
  const flows = (flowsResult.data || []) as Flow[];
  const steps = (stepsResult.data || []) as Step[];
  const entries = (entriesResult.data || []) as Entry[];
  const members = membersResult.data || [];
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const loadError = flowsResult.error || stepsResult.error || entriesResult.error;
  const overdue = entries.filter((entry) => entry.next_action_at && new Date(entry.next_action_at) < new Date()).length;

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#4C1D95] via-[#7C3AED] to-[#2563EB] p-5 text-white shadow-xl shadow-violet-950/15 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><ListTree className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-100">Accompagnement pastoral</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Parcours des personnes</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-violet-50">Transformez l’accueil et le suivi en étapes claires, avec une prochaine action visible pour chaque personne.</p></div></div></section>
        {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Parcours mis à jour avec succès.</div>}
        {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Impossible d’effectuer cette opération. Vérifiez les données ou si la personne est déjà dans ce parcours.</div>}
        {loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le module doit encore être initialisé dans la base de données : {loadError.message}</div>}

        <section className="grid gap-4 sm:grid-cols-3"><MetricCard title="Parcours actifs" value={flows.filter((flow) => flow.status === "active").length} description="Scénarios disponibles" icon={ListTree} accent="purple" /><MetricCard title="Personnes en cours" value={entries.filter((entry) => entry.status === "active").length} description="Accompagnements ouverts" icon={UserPlus} accent="blue" /><MetricCard title="Actions en retard" value={overdue} description="À traiter aujourd’hui" icon={Clock3} accent="orange" /></section>

        {permissions.can_create && <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-black text-[#03357A]">Créer un parcours</h2><form action={createPeopleFlowAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5"><input name="name" required maxLength={120} placeholder="Ex : Intégration nouveau membre" className={inputClass} /><select name="trigger_type" defaultValue="manual" className={inputClass}><option value="manual">Démarrage manuel</option><option value="new_member">Nouveau membre</option><option value="new_convert">Nouveau converti</option><option value="absence">Absence détectée</option><option value="request">Demande reçue</option></select><input name="first_step" required maxLength={120} placeholder="Première étape" className={inputClass} /><input name="due_after_days" type="number" min="0" max="3650" defaultValue="2" aria-label="Délai en jours" className={inputClass} /><input name="description" maxLength={1000} placeholder="Objectif du parcours" className={inputClass} /><ActionSubmitButton pendingLabel="Création…" className="min-h-12 rounded-2xl bg-[#7C3AED] px-5 text-sm font-black text-white disabled:opacity-60 md:col-span-2 xl:col-span-5">Créer le parcours</ActionSubmitButton></form></section>}

        <section className="space-y-4">
          {flows.length === 0 && !loadError && <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-10 text-center text-sm text-slate-500">Aucun parcours. Commencez par le parcours d’intégration d’un nouveau membre.</div>}
          {flows.map((flow) => {
            const flowSteps = steps.filter((step) => step.flow_id === flow.id);
            const flowEntries = entries.filter((entry) => entry.flow_id === flow.id);
            return <article key={flow.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">{flow.trigger_type.replaceAll("_", " ")}</p><h2 className="mt-1 text-xl font-black text-[#03357A]">{flow.name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{flow.description || "Parcours sans description."}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{flowEntries.length} personne(s)</span></div><div className="mt-4 flex flex-wrap items-center gap-2">{flowSteps.map((step, index) => <div key={step.id} className="flex items-center gap-2"><span className="rounded-xl bg-[#F4F0FF] px-3 py-2 text-xs font-bold text-violet-800">{step.position}. {step.name}</span>{index < flowSteps.length - 1 && <ArrowRight className="h-4 w-4 text-slate-300" />}</div>)}</div>
              {permissions.can_update && members.length > 0 && flowSteps.length > 0 && <form action={enrollFlowMemberAction} className="mt-5 flex flex-col gap-3 border-t border-[#E8F0F6] pt-4 sm:flex-row"><input type="hidden" name="flow_id" value={flow.id} /><select name="member_id" required defaultValue="" className={inputClass}><option value="" disabled>Inscrire une personne…</option>{members.map((member) => <option key={member.id} value={member.id}>{memberName(member)}</option>)}</select><ActionSubmitButton pendingLabel="Démarrage…" className="min-h-12 shrink-0 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-60">Démarrer le parcours</ActionSubmitButton></form>}
              {permissions.can_update && <form action={addPeopleFlowStepAction} className="mt-3 flex flex-col gap-3 sm:flex-row"><input type="hidden" name="flow_id" value={flow.id} /><input name="name" required maxLength={120} placeholder="Ajouter une étape…" className={inputClass} /><input name="due_after_days" type="number" min="0" max="3650" defaultValue="2" aria-label="Délai en jours" className={`${inputClass} sm:max-w-36`} /><ActionSubmitButton pendingLabel="Ajout…" className="min-h-12 shrink-0 rounded-2xl bg-violet-100 px-5 text-sm font-black text-violet-800 disabled:opacity-60">Ajouter l’étape</ActionSubmitButton></form>}
              {flowEntries.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{flowEntries.slice(0, 8).map((entry) => <div key={entry.id} className="flex flex-col gap-3 rounded-2xl bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-800">{entry.display_name || "Personne accompagnée"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{stepById.get(entry.current_step_id || "")?.name || "Étape à définir"} · échéance {dueLabel(entry.next_action_at)}</p></div>{permissions.can_update && <form action={advanceFlowEntryAction}><input type="hidden" name="entry_id" value={entry.id} /><ActionSubmitButton pendingLabel="Validation…" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> Étape terminée</ActionSubmitButton></form>}</div>)}</div>}
            </article>;
          })}
        </section>
      </div>
    </AppShell>
  );
}
