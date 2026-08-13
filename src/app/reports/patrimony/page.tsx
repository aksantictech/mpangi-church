import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, CalendarRange, PackageCheck, Wrench } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type Props = { searchParams?: Promise<{ from?: string; to?: string }> };

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: currency === "CDF" ? 0 : 2 }).format(value || 0);
}
function date(value?: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

export default async function PatrimonyReportPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const from = params.from || firstDay;
  const to = params.to || lastDay;
  const { admin, profile } = await requireChurchModuleAccess("assets");

  const [assetsResult, maintenanceResult, movementsResult] = await Promise.all([
    admin.from("patrimony_assets").select("id,name,asset_code,category,status,condition,quantity,current_value,acquisition_value,currency,location,created_at").eq("church_id", profile.church_id).neq("status", "archived").order("created_at", { ascending: false }).limit(500),
    admin.from("patrimony_asset_maintenance").select("id,title,status,cost,currency,planned_date,completed_date,asset:patrimony_assets(name,asset_code)").eq("church_id", profile.church_id).gte("planned_date", from).lte("planned_date", to).order("planned_date", { ascending: false }).limit(300),
    admin.from("patrimony_asset_movements").select("id,movement_type,movement_date,status,quantity,asset:patrimony_assets(name,asset_code)").eq("church_id", profile.church_id).gte("movement_date", from).lte("movement_date", to).order("movement_date", { ascending: false }).limit(300),
  ]);
  const assets = assetsResult.data || [];
  const maintenance = maintenanceResult.data || [];
  const movements = movementsResult.data || [];
  const totalValue = assets.reduce((sum: number, item: any) => sum + Number(item.current_value ?? item.acquisition_value ?? 0), 0);
  const maintenanceCost = maintenance.reduce((sum: number, item: any) => sum + Number(item.cost || 0), 0);
  const attention = assets.filter((item: any) => ["damaged", "out_of_service"].includes(item.condition) || ["lost", "maintenance"].includes(item.status));

  return <AppShell><div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl sm:p-7"><Link href="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-blue-100"><ArrowLeft className="h-4 w-4"/> Centre de rapports</Link><h1 className="mt-4 text-3xl font-black">Rapport patrimoine</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Inventaire, valeur, état des biens, maintenances et mouvements de votre église.</p></section>

    <form className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-sm font-bold text-slate-700">Du<input type="date" name="from" defaultValue={from} className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"/></label><label className="text-sm font-bold text-slate-700">Au<input type="date" name="to" defaultValue={to} className="mt-2 h-12 w-full rounded-2xl border border-[#DCEAF5] px-4"/></label><button className="h-12 rounded-2xl bg-[#03357A] px-6 font-black text-white">Actualiser</button></form>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={PackageCheck} label="Biens actifs" value={String(assets.length)}/><Metric icon={CalendarRange} label="Valeur estimée" value={money(totalValue)}/><Metric icon={Wrench} label="Maintenances / coût" value={`${maintenance.length} · ${money(maintenanceCost)}`}/><Metric icon={ArrowRightLeft} label="Mouvements" value={String(movements.length)}/></section>

    {attention.length > 0 && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black text-amber-900">{attention.length} bien(s) nécessitent une attention</h2><div className="mt-3 flex flex-wrap gap-2">{attention.slice(0, 12).map((item: any) => <Link key={item.id} href={`/patrimony/assets/${item.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-amber-900">{item.name} · {item.condition || item.status}</Link>)}</div></section>}

    <section className="grid gap-5 xl:grid-cols-2"><ReportList title="Maintenances de la période" empty="Aucune maintenance sur cette période." rows={maintenance.map((item: any) => ({ id: item.id, title: item.title, subtitle: `${item.asset?.name || "Bien non renseigné"} · ${item.status}`, detail: `${date(item.planned_date)} · ${money(Number(item.cost || 0), item.currency || "CDF")}` }))}/><ReportList title="Mouvements de la période" empty="Aucun mouvement sur cette période." rows={movements.map((item: any) => ({ id: item.id, title: item.asset?.name || "Bien non renseigné", subtitle: `${item.movement_type} · ${item.status}`, detail: `${date(item.movement_date)} · quantité ${item.quantity || 0}` }))}/></section>
  </div></AppShell>;
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) { return <div className="min-w-0 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><Icon className="h-6 w-6 text-[#2563EB]"/><p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 break-words text-xl font-black text-[#03357A]">{value}</p></div>; }
function ReportList({ title, empty, rows }: { title: string; empty: string; rows: { id: string; title: string; subtitle: string; detail: string }[] }) { return <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><h2 className="text-xl font-black text-[#03357A]">{title}</h2>{rows.length === 0 ? <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{empty}</p> : <div className="mt-4 space-y-3">{rows.map((row) => <article key={row.id} className="rounded-2xl bg-[#F8FBFD] p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="break-words font-black text-slate-800">{row.title}</p><p className="mt-1 break-words text-sm text-slate-500">{row.subtitle}</p></div><p className="shrink-0 text-xs font-bold text-[#03357A]">{row.detail}</p></div></article>)}</div>}</section>; }
