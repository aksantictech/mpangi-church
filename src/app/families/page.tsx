import { HeartHandshake, Home, MapPin, UserPlus, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { addHouseholdMemberAction, createHouseholdAction } from "./actions";

type Household = { id: string; name: string; primary_member_id: string | null; address: string | null; city: string | null; notes: string | null; status: string };
type Link = { household_id: string; member_id: string; relationship: string; is_primary_contact: boolean };
const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#DB2777] focus:ring-4 focus:ring-pink-100";

function fullName(member: { first_name: string | null; last_name: string | null }) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre sans nom";
}

export default async function FamiliesPage({ searchParams }: { searchParams?: Promise<{ saved?: string; error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("families");
  const churchId = profile.church_id;
  const [householdsResult, linksResult, membersResult] = await Promise.all([
    admin.from("church_households").select("id,name,primary_member_id,address,city,notes,status").eq("church_id", churchId).neq("status", "archived").order("name"),
    admin.from("household_members").select("household_id,member_id,relationship,is_primary_contact").eq("church_id", churchId),
    admin.from("members").select("id,first_name,last_name,phone").eq("church_id", churchId).is("archived_at", null).order("last_name").limit(1500),
  ]);
  const households = (householdsResult.data || []) as Household[];
  const links = (linksResult.data || []) as Link[];
  const members = membersResult.data || [];
  const names = new Map(members.map((member) => [member.id, fullName(member)]));
  const linkedMemberIds = new Set(links.map((link) => link.member_id));
  const loadError = householdsResult.error || linksResult.error;

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <section className="rounded-[1.75rem] bg-gradient-to-br from-[#831843] via-[#DB2777] to-[#F97316] p-5 text-white shadow-xl shadow-pink-950/15 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Home className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-100">Liens familiaux</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Foyers et familles</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-pink-50">Regroupez les membres d’un même foyer pour améliorer le suivi pastoral, les contacts et l’accueil des enfants.</p></div></div></section>
    {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Foyer mis à jour avec succès.</div>}
    {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">L’opération n’a pas abouti. Un membre ne peut appartenir qu’à un seul foyer.</div>}
    {loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Initialisation de la Phase 2 nécessaire : {loadError.message}</div>}
    <section className="grid gap-4 sm:grid-cols-3"><MetricCard title="Foyers actifs" value={households.filter((item) => item.status === "active").length} description="Familles suivies" icon={Home} accent="purple" /><MetricCard title="Membres rattachés" value={linkedMemberIds.size} description="Dans un foyer identifié" icon={UsersRound} accent="blue" /><MetricCard title="À rattacher" value={Math.max(0, members.length - linkedMemberIds.size)} description="Dossiers sans foyer" icon={HeartHandshake} accent="orange" /></section>
    {permissions.can_create && <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Créer un foyer</h2><form action={createHouseholdAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><input name="name" required maxLength={140} placeholder="Nom du foyer" className={inputClass} /><select name="primary_member_id" required defaultValue="" className={inputClass}><option value="" disabled>Contact principal…</option>{members.map((member) => <option key={member.id} value={member.id}>{fullName(member)}</option>)}</select><input name="address" maxLength={240} placeholder="Adresse" className={inputClass} /><input name="city" maxLength={120} placeholder="Ville / commune" className={inputClass} /><input name="notes" maxLength={1200} placeholder="Notes pastorales" className={`${inputClass} md:col-span-2 xl:col-span-4`} /><ActionSubmitButton pendingLabel="Création…" className="min-h-12 rounded-2xl bg-[#DB2777] px-5 text-sm font-black text-white disabled:opacity-60 md:col-span-2 xl:col-span-4">Créer le foyer</ActionSubmitButton></form></section>}
    <section className="grid gap-4 xl:grid-cols-2">{households.length === 0 && !loadError && <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">Aucun foyer créé pour le moment.</div>}{households.map((household) => { const householdLinks = links.filter((link) => link.household_id === household.id); return <article key={household.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Foyer</p><h2 className="mt-1 text-xl font-black text-[#03357A]">{household.name}</h2></div><span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-700">{householdLinks.length} personne(s)</span></div><p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-pink-600" />{[household.address, household.city].filter(Boolean).join(", ") || "Adresse à compléter"}</p><div className="mt-4 flex flex-wrap gap-2">{householdLinks.map((link) => <span key={link.member_id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-slate-700">{names.get(link.member_id) || "Membre"} · {link.relationship}</span>)}</div>{permissions.can_update && <form action={addHouseholdMemberAction} className="mt-5 grid gap-2 border-t border-[#E8F0F6] pt-4 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="household_id" value={household.id} /><select name="member_id" required defaultValue="" className={inputClass}><option value="" disabled>Ajouter un membre…</option>{members.map((member) => <option key={member.id} value={member.id}>{fullName(member)}</option>)}</select><select name="relationship" defaultValue="member" className={inputClass}><option value="spouse">Conjoint</option><option value="child">Enfant</option><option value="parent">Parent</option><option value="relative">Proche</option><option value="member">Membre</option></select><ActionSubmitButton pendingLabel="Ajout…" className="min-h-12 rounded-2xl bg-[#03357A] px-4 text-sm font-black text-white disabled:opacity-60"><UserPlus className="mx-auto h-4 w-4" /></ActionSubmitButton></form>}</article>; })}</section>
  </div></AppShell>;
}
