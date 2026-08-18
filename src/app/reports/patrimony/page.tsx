import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  PackageCheck,
  Search,
  Wrench,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    category?: string;
    department?: string;
    acquired_from?: string;
    acquired_to?: string;
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

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00`)
  );
}

function buildExportHref(
  format: "xlsx" | "pdf",
  filters: Record<string, string>
) {
  const query = new URLSearchParams({ format });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `/api/reports/patrimony/export?${query.toString()}`;
}

export default async function PatrimonyReportPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const category = params.category || "";
  const department = params.department || "";
  const acquiredFrom = params.acquired_from || "";
  const acquiredTo = params.acquired_to || "";

  const { admin, profile } = await requireChurchModuleAccess("assets");

  const { data: departments } = await admin
    .from("departments")
    .select("id,name")
    .eq("church_id", profile.church_id)
    .eq("status", "active")
    .order("name");

  let query = admin
    .from("patrimony_assets")
    .select(`
      id,
      asset_code,
      name,
      category,
      acquisition_date,
      quantity,
      unit,
      acquisition_value,
      current_value,
      currency,
      condition,
      status,
      location,
      department_id,
      department:departments(name)
    `)
    .eq("church_id", profile.church_id)
    .neq("status", "archived")
    .order("acquisition_date", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (category) query = query.eq("category", category);
  if (department) query = query.eq("department_id", department);
  if (acquiredFrom) query = query.gte("acquisition_date", acquiredFrom);
  if (acquiredTo) query = query.lte("acquisition_date", acquiredTo);

  const { data, error } = await query;
  const rows = data ?? [];
  const totalValue = rows.reduce(
    (sum: number, row: any) =>
      sum + Number(row.current_value ?? row.acquisition_value ?? 0),
    0
  );
  const maintenanceCount = rows.filter(
    (row: any) => row.status === "maintenance"
  ).length;

  const exportFilters = {
    category,
    department,
    acquired_from: acquiredFrom,
    acquired_to: acquiredTo,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au centre de rapports
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
            Patrimoine
          </p>
          <h1 className="mt-3 text-3xl font-black">Rapport patrimoine</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
            Inventaire filtrable par type, département et date d’acquisition,
            avec export Excel ou PDF.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric icon={PackageCheck} label="Biens affichés" value={String(rows.length)} />
          <Metric icon={FileSpreadsheet} label="Valeur estimée" value={money(totalValue)} />
          <Metric icon={Wrench} label="En maintenance" value={String(maintenanceCount)} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[190px_1fr_170px_170px_auto] xl:items-end">
            <label className="text-sm font-bold text-slate-700">
              Type de bien
              <select name="category" defaultValue={category} className="filter-input mt-2 w-full">
                <option value="">Tous les types</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700">
              Département
              <select name="department" defaultValue={department} className="filter-input mt-2 w-full">
                <option value="">Tous les départements</option>
                {(departments ?? []).map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700">
              Acquisition du
              <input type="date" name="acquired_from" defaultValue={acquiredFrom} className="filter-input mt-2 w-full" />
            </label>

            <label className="text-sm font-bold text-slate-700">
              Au
              <input type="date" name="acquired_to" defaultValue={acquiredTo} className="filter-input mt-2 w-full" />
            </label>

            <div className="flex gap-2">
              <button className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white">
                <Search className="h-4 w-4" /> Filtrer
              </button>
              <Link href="/reports/patrimony" className="inline-flex min-h-12 items-center rounded-2xl bg-[#EAF3FA] px-4 text-sm font-black text-[#03357A]">
                Reset
              </Link>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <a
              href={buildExportHref("xlsx", exportFilters)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
            >
              <Download className="h-4 w-4" /> Excel
            </a>
            <a
              href={buildExportHref("pdf", exportFilters)}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700"
            >
              <Download className="h-4 w-4" /> PDF
            </a>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5">
            <h2 className="text-xl font-black text-[#03357A]">Liste du patrimoine</h2>
            <p className="mt-1 text-sm text-slate-500">{rows.length} bien(s) correspondant aux filtres.</p>
          </div>

          {error ? (
            <p className="p-6 font-bold text-red-700">Impossible de charger le patrimoine : {error.message}</p>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Aucun bien ne correspond aux filtres.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#F8FBFD] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Bien</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Département</th>
                    <th className="px-4 py-3">Acquisition</th>
                    <th className="px-4 py-3">Qté</th>
                    <th className="px-4 py-3">État</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCEAF5]">
                  {rows.map((row: any) => (
                    <tr key={row.id} className="text-slate-700 hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4 font-bold text-[#03357A]">{row.asset_code || "-"}</td>
                      <td className="px-4 py-4">
                        <Link href={`/patrimony/assets/${row.id}`} className="font-black text-[#03357A] hover:underline">
                          {row.name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-400">{row.location || "Localisation non renseignée"}</p>
                      </td>
                      <td className="px-4 py-4">{CATEGORY_LABELS[row.category] || row.category || "-"}</td>
                      <td className="px-4 py-4">{row.department?.name || "Non affecté"}</td>
                      <td className="px-4 py-4">{formatDate(row.acquisition_date)}</td>
                      <td className="px-4 py-4">{row.quantity || 0} {row.unit || ""}</td>
                      <td className="px-4 py-4">{row.condition || "-"}</td>
                      <td className="px-4 py-4">{row.status || "-"}</td>
                      <td className="px-4 py-4 font-black">{money(Number(row.current_value ?? row.acquisition_value ?? 0), row.currency || "CDF")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-[#2563EB]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-[#03357A]">{value}</p>
    </div>
  );
}
