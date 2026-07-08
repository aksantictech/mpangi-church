import Link from "next/link";
import {
  ArrowLeftRight,
  Plus,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type MovementsPageProps = {
  searchParams?: Promise<{
    q?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

const TYPE_LABELS: Record<string, string> = {
  assignment: "Affectation",
  transfer: "Transfert",
  return: "Retour",
  loan: "Prêt",
  loss: "Perte",
  sale: "Vente",
  disposal: "Sortie définitive",
  inventory_adjustment: "Ajustement inventaire",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  completed: "Terminé",
  cancelled: "Annulé",
  archived: "Archivé",
};

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
  if (status === "archived" || status === "cancelled") return "bg-slate-100 text-slate-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

export default async function PatrimonyMovementsPage({
  searchParams,
}: MovementsPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const type = params.type || "";
  const status = params.status || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";

  const { admin, profile } = await requireChurchModuleAccess("asset_movements");

  let query = admin
    .from("patrimony_asset_movements")
    .select(
      `
      id,
      movement_type,
      movement_date,
      from_location,
      to_location,
      quantity,
      reason,
      status,
      asset:patrimony_assets(id, name, asset_code)
      `
    )
    .eq("church_id", profile.church_id)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (type) query = query.eq("movement_type", type);
  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("movement_date", dateFrom);
  if (dateTo) query = query.lte("movement_date", dateTo);

  const { data: movements } = await query;
  let rows = movements ?? [];

  if (q) {
    rows = rows.filter((row: any) => {
      const haystack = `${row.asset?.name || ""} ${row.asset?.asset_code || ""} ${row.reason || ""}`.toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
  }

  const completedCount = rows.filter((row: any) => row.status === "completed").length;
  const draftCount = rows.filter((row: any) => row.status === "draft").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Volet patrimoine</p>
              <h1 className="mt-3 text-3xl font-extrabold">Mouvements patrimoine</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Affectations, transferts, retours, pertes, ventes et ajustements d’inventaire.
              </p>
            </div>

            <Link href="/patrimony/movements/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
              <Plus className="h-4 w-4" />
              Nouveau mouvement
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Mouvements affichés" value={String(rows.length)} />
          <Metric label="Terminés" value={String(completedCount)} />
          <Metric label="Brouillons" value={String(draftCount)} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_190px_170px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Rechercher bien, code, motif..." className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" />
            </div>

            <select name="type" defaultValue={type} className="filter-input">
              <option value="">Tous types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <input type="date" name="dateFrom" defaultValue={dateFrom} className="filter-input" />
            <input type="date" name="dateTo" defaultValue={dateTo} className="filter-input" />

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">Filtrer</button>
              <Link href="/patrimony/movements" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Reset</Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">Mouvements enregistrés</h2>
            <p className="mt-1 text-sm text-slate-500">{rows.length} mouvement(s) affiché(s).</p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <ArrowLeftRight className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">Aucun mouvement trouvé.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.2fr_0.75fr_0.65fr_0.9fr]">
                  <div>
                    <p className="font-extrabold text-[#03357A]">{TYPE_LABELS[row.movement_type] || row.movement_type}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Bien : {row.asset?.name || "-"} · Code : {row.asset?.asset_code || "-"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{row.reason || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date / quantité</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{formatDate(row.movement_date)}</p>
                    <p className="mt-1 text-xs text-slate-500">Quantité : {row.quantity}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#F8FBFD] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Localisation</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {row.from_location || "-"} → {row.to_location || "-"}
                    </p>
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
