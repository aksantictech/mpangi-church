import Link from "next/link";
import {
  Archive,
  Download,
  Eye,
  PackageCheck,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { archivePatrimonyAssetAction } from "../actions";

type AssetsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    status?: string;
    condition?: string;
  }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  building: "Bâtiment",
  land: "Terrain",
  vehicle: "Véhicule",
  sound: "Sonorisation",
  it: "Informatique",
  furniture: "Mobilier",
  instrument: "Instrument",
  office: "Bureau",
  security: "Sécurité",
  other: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  assigned: "Affecté",
  maintenance: "Maintenance",
  lost: "Perdu",
  sold: "Vendu / sorti",
  archived: "Archivé",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Neuf",
  good: "Bon",
  average: "Moyen",
  damaged: "Endommagé",
  out_of_service: "Hors service",
};

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

function getStatusClass(status: string) {
  if (status === "available") return "bg-green-50 text-green-700";
  if (status === "maintenance") return "bg-orange-50 text-orange-700";
  if (["lost", "sold", "archived"].includes(status)) return "bg-slate-100 text-slate-700";
  return "bg-[#EAF3FA] text-[#03357A]";
}

function currentUrl(params: { q: string; category: string; status: string; condition: string }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.condition) query.set("condition", params.condition);
  const value = query.toString();
  return value ? `/patrimony/assets?${value}` : "/patrimony/assets";
}

export default async function PatrimonyAssetsPage({ searchParams }: AssetsPageProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params.q || "").trim();
  const category = params.category || "";
  const status = params.status || "";
  const condition = params.condition || "";
  const redirectTo = currentUrl({ q, category, status, condition });

  const { admin, profile } = await requireChurchModuleAccess("assets");

  let query = admin
    .from("patrimony_assets")
    .select(
      `
      id,
      asset_code,
      name,
      category,
      quantity,
      unit,
      current_value,
      acquisition_value,
      currency,
      condition,
      status,
      location,
      document_path,
      document_name,
      department:departments(name)
      `
    )
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false })
    .limit(300);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);
  if (condition) query = query.eq("condition", condition);
  if (q) query = query.or(`name.ilike.%${q}%,asset_code.ilike.%${q}%,serial_number.ilike.%${q}%`);

  const { data: assets } = await query;
  const rows = assets ?? [];

  const activeRows = rows.filter((row: any) => row.status !== "archived");
  const totalValue = activeRows.reduce(
    (sum: number, row: any) => sum + Number(row.current_value ?? row.acquisition_value ?? 0),
    0
  );
  const maintenanceCount = rows.filter((row: any) => row.status === "maintenance").length;
  const assignedCount = rows.filter((row: any) => row.status === "assigned").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Volet patrimoine</p>
              <h1 className="mt-3 text-3xl font-extrabold">Biens et inventaire</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Inventaire complet des biens, matériels, véhicules, bâtiments, instruments et équipements.
              </p>
            </div>

            <Link href="/patrimony/assets/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
              <Plus className="h-4 w-4" />
              Nouveau bien
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Biens affichés" value={String(rows.length)} />
          <Metric label="Valeur estimée" value={money(totalValue)} />
          <Metric label="Affectés" value={String(assignedCount)} />
          <Metric label="Maintenance" value={String(maintenanceCount)} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_190px_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="Rechercher nom, code, série..." className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" />
            </div>

            <select name="category" defaultValue={category} className="filter-input">
              <option value="">Toutes catégories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select name="status" defaultValue={status} className="filter-input">
              <option value="">Tous statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select name="condition" defaultValue={condition} className="filter-input">
              <option value="">Tous états</option>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">Filtrer</button>
              <Link href="/patrimony/assets" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Reset</Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-extrabold text-[#03357A]">Inventaire</h2>
            <p className="mt-1 text-sm text-slate-500">{rows.length} bien(s) affiché(s).</p>
          </div>

          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <PackageCheck className="mx-auto h-12 w-12 text-[#3F79B3]" />
              <p className="mt-4 font-extrabold text-[#03357A]">Aucun bien trouvé.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((row: any) => (
                <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1.25fr_0.7fr_0.65fr_0.95fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[#03357A]">{row.name}</p>
                      <span className="rounded-full bg-[#EAF3FA] px-2 py-0.5 text-xs font-extrabold text-[#03357A]">
                        {CATEGORY_LABELS[row.category] || row.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.asset_code || "Sans code"} · {row.location || "-"} · {row.department?.name || "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/patrimony/assets/${row.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-3 py-2 text-xs font-extrabold text-[#03357A]">
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>

                      <Link href={`/patrimony/assets/${row.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-[#2563EB] ring-1 ring-[#DCEAF5]">
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>

                      {row.document_path && (
                        <a href={getDocumentDownloadHref({ path: row.document_path, filename: row.document_name || row.name })} className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-[#DCEAF5]">
                          <Download className="h-4 w-4" />
                          Fichier
                        </a>
                      )}

                      {row.status !== "archived" && (
                        <form action={archivePatrimonyAssetAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="redirectTo" value={redirectTo} />
                          <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                            <Archive className="h-4 w-4" />
                            Archiver
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Quantité</p>
                    <p className="mt-1 text-lg font-black text-slate-800">{row.quantity} {row.unit}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{CONDITION_LABELS[row.condition] || row.condition}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p>
                    <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClass(row.status)}`}>
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#F8FBFD] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Valeur</p>
                    <p className="mt-2 text-sm font-black text-slate-800">
                      {money(Number(row.current_value ?? row.acquisition_value ?? 0), row.currency || "CDF")}
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
