import {
  CalendarClock,
  MapPin,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { assignGroupMemberAction, createMinistryGroupAction } from "./actions";

type Query = Promise<{ saved?: string; error?: string }>;
type Group = {
  id: string;
  name: string;
  group_type: string;
  description: string | null;
  meeting_day: number | null;
  meeting_time: string | null;
  meeting_location: string | null;
  capacity: number | null;
  leader_profile_id: string | null;
  status: string;
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100";

function memberName(member: { first_name: string | null; last_name: string | null }) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre sans nom";
}

export default async function GroupsPage({ searchParams }: { searchParams?: Query }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("groups");
  const churchId = profile.church_id;

  const [groupsResult, linksResult, leadersResult, membersResult] = await Promise.all([
    admin.from("ministry_groups").select("id,name,group_type,description,meeting_day,meeting_time,meeting_location,capacity,leader_profile_id,status").eq("church_id", churchId).neq("status", "archived").order("name"),
    admin.from("ministry_group_members").select("group_id,status").eq("church_id", churchId),
    admin.from("profiles").select("id,full_name").eq("church_id", churchId).eq("status", "active").order("full_name"),
    admin.from("members").select("id,first_name,last_name").eq("church_id", churchId).is("archived_at", null).order("last_name").limit(1000),
  ]);

  const groups = (groupsResult.data || []) as Group[];
  const links = linksResult.data || [];
  const leaders = leadersResult.data || [];
  const members = membersResult.data || [];
  const leaderNames = new Map(leaders.map((leader) => [leader.id, leader.full_name || "Responsable"]));
  const memberCount = new Map<string, number>();
  for (const link of links) {
    if (link.status !== "left") memberCount.set(link.group_id, (memberCount.get(link.group_id) || 0) + 1);
  }
  const loadError = groupsResult.error || linksResult.error;

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-0">
        <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#0EA5A4] p-5 text-white shadow-xl shadow-emerald-950/15 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><UsersRound className="h-7 w-7" /></div>
            <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Vie communautaire</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Cellules et groupes</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50">Centralisez les responsables, membres, lieux et rythmes de rencontre de chaque petit groupe.</p></div>
          </div>
        </section>

        {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Modification enregistrée avec succès.</div>}
        {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">L’opération n’a pas abouti. Vérifiez les informations puis réessayez.</div>}
        {loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le module doit encore être initialisé dans la base de données : {loadError.message}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Groupes actifs" value={groups.filter((group) => group.status === "active").length} description={`${groups.length} groupe(s) au total`} icon={UsersRound} accent="green" />
          <MetricCard title="Participations" value={links.filter((link) => link.status === "active").length} description="Membres actuellement rattachés" icon={UserPlus} accent="blue" />
          <MetricCard title="Sans responsable" value={groups.filter((group) => !group.leader_profile_id).length} description="À affecter en priorité" icon={ShieldCheck} accent="orange" />
        </section>

        {permissions.can_create && (
          <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-[#03357A]">Créer un groupe</h2>
            <form action={createMinistryGroupAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input name="name" required maxLength={120} placeholder="Nom du groupe" className={inputClass} />
              <select name="group_type" defaultValue="cellule" className={inputClass}><option value="cellule">Cellule</option><option value="discipulat">Discipulat</option><option value="priere">Prière</option><option value="jeunesse">Jeunesse</option><option value="famille">Famille</option><option value="autre">Autre</option></select>
              <select name="leader_profile_id" defaultValue="" className={inputClass}><option value="">Responsable à définir</option>{leaders.map((leader) => <option key={leader.id} value={leader.id}>{leader.full_name || "Responsable"}</option>)}</select>
              <input name="capacity" type="number" min="1" max="5000" placeholder="Capacité" className={inputClass} />
              <select name="meeting_day" defaultValue="" className={inputClass}><option value="">Jour à définir</option>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
              <input name="meeting_time" type="time" className={inputClass} />
              <input name="meeting_location" maxLength={180} placeholder="Lieu de rencontre" className={inputClass} />
              <input name="description" maxLength={1000} placeholder="Objectif du groupe" className={inputClass} />
              <ActionSubmitButton pendingLabel="Création…" className="min-h-12 rounded-2xl bg-[#047857] px-5 text-sm font-black text-white shadow-sm disabled:opacity-60 md:col-span-2 xl:col-span-4">Créer le groupe</ActionSubmitButton>
            </form>
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-2">
          {groups.length === 0 && !loadError && <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">Aucun groupe pour le moment. Créez la première cellule ci-dessus.</div>}
          {groups.map((group) => {
            const count = memberCount.get(group.id) || 0;
            return (
              <article key={group.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">{group.group_type}</p><h2 className="mt-1 text-xl font-black text-[#03357A]">{group.name}</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{count}{group.capacity ? ` / ${group.capacity}` : ""} membres</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{group.description || "Aucune description renseignée."}</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />{group.leader_profile_id ? leaderNames.get(group.leader_profile_id) || "Responsable" : "Responsable à affecter"}</p><p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-emerald-600" />{group.meeting_day === null ? "Horaire à définir" : `${DAYS[group.meeting_day]}${group.meeting_time ? ` à ${group.meeting_time.slice(0, 5)}` : ""}`}</p><p className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-emerald-600" />{group.meeting_location || "Lieu à définir"}</p></div>
                {permissions.can_update && members.length > 0 && (
                  <form action={assignGroupMemberAction} className="mt-5 grid gap-3 border-t border-[#E8F0F6] pt-4 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="group_id" value={group.id} />
                    <select name="member_id" required defaultValue="" className={inputClass}><option value="" disabled>Ajouter un membre…</option>{members.map((member) => <option key={member.id} value={member.id}>{memberName(member)}</option>)}</select>
                    <select name="member_role" defaultValue="member" className={inputClass}><option value="member">Membre</option><option value="assistant">Assistant</option><option value="host">Hôte</option><option value="leader">Leader</option></select>
                    <ActionSubmitButton pendingLabel="Affectation…" className="min-h-12 rounded-2xl bg-[#03357A] px-4 text-sm font-black text-white disabled:opacity-60">Affecter</ActionSubmitButton>
                  </form>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
