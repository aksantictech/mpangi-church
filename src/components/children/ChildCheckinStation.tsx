"use client";

import { useActionState } from "react";
import { CheckCircle2, KeyRound, LogIn, LogOut, ShieldAlert } from "lucide-react";
import {
  checkInChildAction,
  checkOutChildAction,
  type CheckinActionState,
} from "@/app/child-checkin/actions";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";

type Child = { id: string; first_name: string; last_name: string; guardian_name: string; allergies: string | null };
type ActiveCheckin = { id: string; child_id: string; room_name: string | null; checked_in_at: string; pickup_code_last4: string; childName: string };
type Plan = { id: string; title: string; starts_at: string };
const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#0F766E] focus:ring-4 focus:ring-teal-100";
const INITIAL_CHECKIN_STATE: CheckinActionState = { status: "idle", message: "" };

export default function ChildCheckinStation({ childrenList, activeCheckins, plans }: { childrenList: Child[]; activeCheckins: ActiveCheckin[]; plans: Plan[] }) {
  const [arrivalState, arrivalAction] = useActionState(checkInChildAction, INITIAL_CHECKIN_STATE);
  const [departureState, departureAction] = useActionState(checkOutChildAction, INITIAL_CHECKIN_STATE);
  return <section className="grid gap-5 xl:grid-cols-2">
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><LogIn className="h-6 w-6 text-teal-700" /><h2 className="text-xl font-black text-[#03357A]">Enregistrer une arrivée</h2></div><form action={arrivalAction} className="mt-5 space-y-3"><select name="child_id" required defaultValue="" className={inputClass}><option value="" disabled>Choisir un enfant…</option>{childrenList.map((child) => <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>)}</select><select name="service_plan_id" defaultValue="" className={inputClass}><option value="">Sans programme associé</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select><input name="room_name" maxLength={100} placeholder="Salle / groupe d’âge" className={inputClass} /><input name="notes" maxLength={600} placeholder="Consigne du jour" className={inputClass} /><ActionSubmitButton pendingLabel="Enregistrement…" className="min-h-12 w-full rounded-2xl bg-teal-700 px-5 text-sm font-black text-white disabled:opacity-60">Confirmer l’arrivée</ActionSubmitButton></form>{arrivalState.message && <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${arrivalState.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{arrivalState.message}{arrivalState.pickupCode && <div className="mt-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4 text-center"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Code confidentiel de retrait</p><p className="mt-1 text-4xl font-black tracking-[0.25em] text-[#03357A]">{arrivalState.pickupCode}</p><p className="mt-2 text-xs text-slate-500">À communiquer uniquement au responsable autorisé.</p></div>}</div>}</div>
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><LogOut className="h-6 w-6 text-orange-600" /><h2 className="text-xl font-black text-[#03357A]">Valider un départ</h2></div><form action={departureAction} className="mt-5 space-y-3"><select name="checkin_id" required defaultValue="" className={inputClass}><option value="" disabled>Enfant actuellement présent…</option>{activeCheckins.map((item) => <option key={item.id} value={item.id}>{item.childName} · code finissant par {item.pickup_code_last4}</option>)}</select><input name="pickup_code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="Code de retrait à 6 chiffres" className={inputClass} /><ActionSubmitButton pendingLabel="Vérification…" className="min-h-12 w-full rounded-2xl bg-orange-600 px-5 text-sm font-black text-white disabled:opacity-60">Vérifier et autoriser le départ</ActionSubmitButton></form>{departureState.message && <div className={`mt-4 flex items-start gap-2 rounded-2xl p-4 text-sm font-bold ${departureState.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{departureState.status === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}{departureState.message}</div>}<div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#03357A]" />Le code n’est jamais conservé en clair. Après cinq erreurs, le retrait est automatiquement verrouillé.</div></div>
  </section>;
}
