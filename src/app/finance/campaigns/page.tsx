import { CalendarDays, HandCoins, Target, TrendingUp, UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ActionSubmitButton from "@/components/forms/ActionSubmitButton";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { createCampaignAction, createPledgeAction, recordPledgePaymentAction } from "./actions";

type Query = Promise<{ saved?: string; error?: string }>;
type Campaign = { id: string; name: string; description: string | null; target_amount: number; currency: string; starts_on: string | null; ends_on: string | null; status: string };
type Pledge = { id: string; campaign_id: string; donor_name: string; pledged_amount: number; paid_amount: number; currency: string; frequency: string; due_date: string | null; status: string };

const inputClass = "min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100";
const money = (value: number, currency: string) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} ${currency}`;

export default async function CampaignsPage({ searchParams }: { searchParams?: Query }) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile, permissions } = await requireChurchModuleAccess("giving_campaigns");
  const [campaignResult, pledgeResult] = await Promise.all([
    admin.from("giving_campaigns").select("id,name,description,target_amount,currency,starts_on,ends_on,status").eq("church_id", profile.church_id).neq("status", "archived").order("created_at", { ascending: false }),
    admin.from("giving_pledges").select("id,campaign_id,donor_name,pledged_amount,paid_amount,currency,frequency,due_date,status").eq("church_id", profile.church_id).neq("status", "cancelled").order("created_at", { ascending: false }),
  ]);
  const campaigns = (campaignResult.data || []) as Campaign[];
  const pledges = (pledgeResult.data || []) as Pledge[];
  const pledgedTotal = pledges.reduce((sum, item) => sum + Number(item.pledged_amount || 0), 0);
  const paidTotal = pledges.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
  const mainCurrency = campaigns[0]?.currency || "CDF";

  return <AppShell><div className="space-y-6 pb-24 md:pb-0">
    <section className="rounded-[1.75rem] bg-gradient-to-br from-[#78350F] via-[#D97706] to-[#F59E0B] p-5 text-white shadow-xl shadow-amber-950/15 sm:p-7">
      <div className="flex items-start gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Target className="h-7 w-7" /></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-100">Générosité & projets</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Campagnes et promesses de dons</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-amber-50">Suivez les objectifs, les engagements et chaque versement sans perdre la relation avec les donateurs.</p></div></div>
    </section>
    {params.saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Enregistrement effectué avec succès.</div>}
    {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">L’opération n’a pas abouti. Vérifiez les informations puis réessayez.</div>}
    {(campaignResult.error || pledgeResult.error) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le module doit encore être initialisé dans la base de données.</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Campagnes actives" value={campaigns.filter((item) => item.status === "active").length} description={`${campaigns.length} campagne(s) suivie(s)`} icon={Target} accent="orange" />
      <MetricCard title="Promesses" value={money(pledgedTotal, mainCurrency)} description={`${pledges.length} engagement(s)`} icon={UsersRound} accent="blue" />
      <MetricCard title="Déjà versé" value={money(paidTotal, mainCurrency)} description="Versements enregistrés" icon={HandCoins} accent="green" />
      <MetricCard title="Taux réalisé" value={`${pledgedTotal ? Math.round((paidTotal / pledgedTotal) * 100) : 0} %`} description="Sur les promesses" icon={TrendingUp} accent="purple" />
    </section>

    {permissions.can_create && <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Nouvelle campagne</h2><form action={createCampaignAction} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input name="name" required maxLength={140} placeholder="Nom du projet" className={`${inputClass} sm:col-span-2`} />
        <input name="target_amount" type="number" min="1" step="0.01" required placeholder="Objectif" className={inputClass} /><select name="currency" defaultValue="CDF" className={inputClass}><option>CDF</option><option>USD</option><option>EUR</option></select>
        <input name="starts_on" type="date" className={inputClass} /><input name="ends_on" type="date" className={inputClass} />
        <textarea name="description" maxLength={1200} placeholder="But et utilisation des fonds" className={`${inputClass} min-h-28 py-3 sm:col-span-2`} />
        <select name="status" defaultValue="active" className={inputClass}><option value="active">Active immédiatement</option><option value="draft">Brouillon</option></select><label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold text-slate-700"><input name="public_enabled" type="checkbox" />Visible publiquement</label>
        <ActionSubmitButton pendingLabel="Création…" className="min-h-12 rounded-2xl bg-[#D97706] px-5 text-sm font-black text-white sm:col-span-2">Créer la campagne</ActionSubmitButton>
      </form></div>
      <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">Nouvelle promesse</h2><form action={createPledgeAction} className="mt-5 grid gap-3 sm:grid-cols-2">
        <select name="campaign_id" required defaultValue="" className={`${inputClass} sm:col-span-2`}><option value="" disabled>Choisir une campagne</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input name="donor_name" required maxLength={180} placeholder="Nom du donateur" className={inputClass} /><input name="donor_phone" maxLength={60} placeholder="Téléphone" className={inputClass} />
        <input name="donor_email" type="email" maxLength={180} placeholder="E-mail" className={inputClass} /><input name="pledged_amount" type="number" min="1" step="0.01" required placeholder="Montant promis" className={inputClass} />
        <select name="frequency" defaultValue="one_time" className={inputClass}><option value="one_time">Une fois</option><option value="monthly">Mensuel</option><option value="quarterly">Trimestriel</option></select><input name="due_date" type="date" className={inputClass} />
        <input name="notes" maxLength={1000} placeholder="Note interne" className={`${inputClass} sm:col-span-2`} />
        <ActionSubmitButton pendingLabel="Enregistrement…" className="min-h-12 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white sm:col-span-2">Enregistrer la promesse</ActionSubmitButton>
      </form></div>
    </section>}

    <section className="grid gap-5 xl:grid-cols-2">{campaigns.length === 0 && <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-10 text-center text-sm text-slate-500 xl:col-span-2">Aucune campagne pour le moment.</div>}{campaigns.map((campaign) => {
      const related = pledges.filter((item) => item.campaign_id === campaign.id); const promised = related.reduce((sum, item) => sum + Number(item.pledged_amount), 0); const paid = related.reduce((sum, item) => sum + Number(item.paid_amount), 0); const progress = Math.min(100, Math.round((paid / Number(campaign.target_amount)) * 100) || 0);
      return <article key={campaign.id} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">{campaign.status}</p><h2 className="mt-1 text-xl font-black text-[#03357A]">{campaign.name}</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">{progress} % atteint</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{campaign.description || "Aucune description."}</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-sm font-bold text-slate-700"><span>{money(paid, campaign.currency)} versés</span><span>Objectif {money(Number(campaign.target_amount), campaign.currency)}</span></div><p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4" />{campaign.starts_on || "Début libre"} — {campaign.ends_on || "Sans date de fin"} · {money(promised, campaign.currency)} promis</p>
      <div className="mt-5 space-y-3 border-t border-[#E8F0F6] pt-4">{related.map((pledge) => <div key={pledge.id} className="rounded-2xl bg-[#F7FAFC] p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-black text-[#03357A]">{pledge.donor_name}</p><p className="text-sm font-black text-emerald-700">{money(Number(pledge.paid_amount), pledge.currency)} / {money(Number(pledge.pledged_amount), pledge.currency)}</p></div>{permissions.can_update && pledge.status !== "fulfilled" && <form action={recordPledgePaymentAction} className="mt-3 grid gap-2 sm:grid-cols-4"><input type="hidden" name="pledge_id" value={pledge.id} /><input name="amount" type="number" min="1" step="0.01" required placeholder="Versement" className={inputClass} /><input name="paid_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} /><select name="method" defaultValue="cash" className={inputClass}><option value="cash">Espèces</option><option value="mobile_money">Mobile Money</option><option value="bank_transfer">Virement</option><option value="card">Carte</option></select><ActionSubmitButton pendingLabel="Ajout…" className="min-h-12 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white">Ajouter</ActionSubmitButton></form>}</div>)}</div></article>;
    })}</section>
  </div></AppShell>;
}
