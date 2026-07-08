import Link from "next/link";
import {
  Download,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { updateAssetMaintenanceStatusAction } from "../actions";

type MaintenancePageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    type?: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifiée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  archived: "Archivée",
};

const TYPE_LABELS: Record<string, string> = {
  preventive: "Préventive",
  corrective: "Corrective",
  inspection: "Inspection",
  repair: "Réparation",
  other: "Autre",
};

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function getStatusClass(status: string) {
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "in_progress") return "bg-orange-50 text-orange-700";
  if (status === "archived" || status === "cancelled") return "bg-slate-100 text-slate-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

export default async function PatrimonyMaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const status = params.status || "";
  const type = params.type || "";

  const { admin, profile } = await requireChurchModuleAccess("asset_maintenance");

  let query = admin
    .from("patrimony_asset_maintenance")
    .select(
      `
      id,
      title,
      maintenance_type,
      provider_name,
      cost,
      currency,
      status,
      planned_date,
      completed_date,
      next_due_date,
      document_path,
      document_name,
      asset:patrimony_assets(id, name, asset_code)
      `
    )
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("maintenance_type", type);
  if (q) query = query.or(`title.ilike.%${q}%,provider_name.ilike.%${q}%`);

  const { data: maintenance } = await query;
  const rows = maintenance ?? [];

  const openCount = rows.filter((row: any) => ["planned", "in_progress"].includes(row.status)).length;
  const completedCount = rows.filter((row: any) => row.status === "completed").length;
  const totalCost = rows.reduce((sum: number, row: any) => sum + Number(row.cost || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Volet patrimoine</p>
              <h1 className="mt-3 text-3xl font-extrabold">Maintenance patrimoine</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Suivez les réparations, inspections, maintenances préventives et coûts associés.
              </p>
            </div>

            <Link href="/patrimony/maintenance/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
              <Plus className="h-4 w-4" />
              Nouvelle maintenance
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Ouvertes" value={String(openCount)} />
          <Metric label="Terminées" value={String(completedCount)} />
          <Metric label="Coût affiché" value={money(totalCost)} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Rechercher maintenance ou prestataire..." className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" />
            </div>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select name="type" defaultValue={type} className="filter-input">
              <option value="">Tous types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">Filtrer</button>
              <Link href="/patrimony/maintenance" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Reset</Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">Maintenances enregistrées</h2>
            <p className="mt-1 text-sm text-slate-500">{rows.length} maintenance(s) affichée(s).</p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <Wrench className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">Aucune maintenance trouvée.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.2fr_0.75fr_0.65fr_0.9fr]">
                  <div>
                    <p className="font-extrabold text-[#03357A]">{row.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Bien : {row.asset?.name || "-"} · Prestataire : {row.provider_name || "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.document_path && (
                        <a href={getDocumentDownloadHref({ path: row.document_path, filename: row.document_name || row.title })} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-[#DCEAF5]">
                          <Download className="h-4 w-4" />
                          Fichier
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{formatDate(row.planned_date)}</p>
                    <p className="mt-1 text-xs text-slate-500">Prochaine : {formatDate(row.next_due_date)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{TYPE_LABELS[row.maintenance_type] || row.maintenance_type}</p>
                  </div>

                  <div className="rounded-2xl bg-[#F8FBFD] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Action rapide</p>
                    <form action={updateAssetMaintenanceStatusAction} className="mt-2 space-y-2">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="asset_id" value={row.asset?.id || ""} />
                      <select name="status" defaultValue={row.status} className="min-h-10 w-full rounded-2xl border border-[#DCEAF5] bg-white px-3 text-xs font-bold text-slate-700 outline-none">
                        <option value="planned">Planifiée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                        <option value="archived">Archivée</option>
                      </select>
                      <button type="submit" className="w-full rounded-2xl bg-[#03357A] px-3 py-2 text-xs font-extrabold text-white">Mettre à jour</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#03357A]">{value}</p>
    </div>
  );
}
