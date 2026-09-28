import { Baby, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import ChildCheckinStation from "@/components/children/ChildCheckinStation";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createChildProfileAction } from "./actions";

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-4 focus:ring-teal-100";

export default async function ChildCheckinPage({ searchParams }: { searchParams?: Promise<{ saved?: string; error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("child_checkin");
  const churchId = profile.church_id;
  const now = new Date().toISOString();
  const [childrenResult, checkinsResult, householdsResult, plansResult] = await Promise.all([
    admin.from("child_profiles").select("id,first_name,last_name,guardian_name,guardian_phone,allergies,status").eq("church_id", churchId).neq("status", "archived").order("last_name"),
    admin.from("child_checkins").select("id,child_id,room_name,checked_in_at,pickup_code_last4,status,locked_at").eq("church_id", churchId).eq("status", "checked_in").order("checked_in_at"),
    admin.from("church_households").select("id,name").eq("church_id", churchId).eq("status", "active").order("name"),
    admin.from("service_plans").select("id,title,starts_at").eq("church_id", churchId).gte("starts_at", now).neq("status", "cancelled").order("starts_at").limit(30),
  ]);
  const children = childrenResult.data || [];
  const activeCheckins = checkinsResult.data || [];
  const childNames = new Map(children.map((child) => [child.id, `${child.first_name} ${child.last_name}`]));
  const stationCheckins = activeCheckins.map((item) => ({ ...item, childName: childNames.get(item.child_id) || "Enfant" }));
  const loadError = childrenResult.error || checkinsResult.error;

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <section className="rounded-[1.75rem] bg-gradient-to-br from-[#134E4A] via-[#0F766E] to-[#22C55E] p-5 text-white shadow-xl shadow-teal-950/15 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Baby className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-100">Protection des mineurs</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Accueil sécurisé des enfants</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-teal-50">Enregistrez les arrivées et n’autorisez un départ qu’après vérification du code confidentiel du responsable.</p></div></div></section>
    {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Profil enfant enregistré.</div>}{params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Impossible d’enregistrer le profil enfant.</div>}{loadError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Initialisation de la Phase 2 nécessaire : {loadError.message}</div>}
    <section className="grid gap-4 sm:grid-cols-3"><MetricCard title="Enfants enregistrés" value={children.length} description="Profils disponibles" icon={UsersRound} accent="blue" /><MetricCard title="Présents maintenant" value={activeCheckins.length} description="Arrivées sans départ" icon={UserCheck} accent="green" /><MetricCard title="Retraits verrouillés" value={activeCheckins.filter((item) => item.locked_at).length} description="Intervention requise" icon={ShieldCheck} accent="orange" /></section>
    {permissions.can_update && <ChildCheckinStation childrenList={children} activeCheckins={stationCheckins} plans={plansResult.data || []} />}
    {permissions.can_create && <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Ajouter un enfant</h2><form action={createChildProfileAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><input name="first_name" required maxLength={100} placeholder="Prénom" className={inputClass} /><input name="last_name" required maxLength={100} placeholder="Nom" className={inputClass} /><input name="birth_date" type="date" className={inputClass} /><select name="household_id" defaultValue="" className={inputClass}><option value="">Foyer non renseigné</option>{(householdsResult.data || []).map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}</select><input name="guardian_name" required maxLength={180} placeholder="Responsable légal" className={inputClass} /><input name="guardian_phone" required maxLength={60} placeholder="Téléphone du responsable" className={inputClass} /><input name="authorized_pickup_names" maxLength={600} placeholder="Personnes autorisées au retrait" className={`${inputClass} md:col-span-2`} /><input name="allergies" maxLength={600} placeholder="Allergies" className={`${inputClass} md:col-span-2`} /><input name="medical_notes" maxLength={1000} placeholder="Informations médicales utiles" className={`${inputClass} md:col-span-2`} /><ActionSubmitButton pendingLabel="Enregistrement…" className="min-h-12 rounded-2xl bg-[#0F766E] px-5 text-sm font-black text-white disabled:opacity-60 md:col-span-2 xl:col-span-4">Créer le profil enfant</ActionSubmitButton></form></section>}
  </div></AppShell>;
}
