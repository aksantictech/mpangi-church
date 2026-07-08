import Link from "next/link";
import {
  PackageCheck,
  Plus,
  Wrench,
  ArrowLeftRight,
  Warehouse,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

function money(value: number, currency = "CDF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value || 0);
}

export default async function PatrimonyDashboardPage() {
  const { admin, profile } = await requireChurchModuleAccess("patrimony_dashboard");

  const [{ data: assets }, { data: maintenance }, { data: movements }] = await Promise.all([
    admin
      .from("patrimony_assets")
      .select("id, name, category, status, condition, current_value, acquisition_value, currency")
      .eq("church_id", profile.church_id)
      .neq("status", "archived")
      .limit(500),

    admin
      .from("patrimony_asset_maintenance")
      .select("id, title, status, cost, currency")
      .eq("church_id", profile.church_id)
      .neq("status", "archived")
      .limit(200),

    admin
      .from("patrimony_asset_movements")
      .select("id, movement_type, status")
      .eq("church_id", profile.church_id)
      .neq("status", "archived")
      .limit(200),
  ]);

  const assetRows = assets ?? [];
  const maintenanceRows = maintenance ?? [];
  const movementRows = movements ?? [];

  const totalValue = assetRows.reduce(
    (sum: number, row: any) =>
      sum + Number(row.current_value ?? row.acquisition_value ?? 0),
    0
  );

  const assignedCount = assetRows.filter((row: any) => row.status === "assigned").length;
  const maintenanceCount = assetRows.filter((row: any) => row.status === "maintenance").length;
  const damagedCount = assetRows.filter((row: any) =>
    ["damaged", "out_of_service"].includes(row.condition)
  ).length;

  const recentAssets = assetRows.slice(0, 6);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet patrimoine
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">
                Dashboard patrimoine
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Suivi des biens, affectations, maintenance, mouvements et valeur estimée du patrimoine de l’église.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/patrimony/assets/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]">
                <Plus className="h-4 w-4" />
                Nouveau bien
              </Link>
              <Link href="/patrimony/movements/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/30 hover:bg-white/20">
                <ArrowLeftRight className="h-4 w-4" />
                Mouvement
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Biens actifs" value={String(assetRows.length)} icon={PackageCheck} />
          <Metric label="Valeur estimée" value={money(totalValue)} icon={Warehouse} />
          <Metric label="Affectés" value={String(assignedCount)} icon={ArrowLeftRight} />
          <Metric label="Maintenance" value={String(maintenanceCount)} icon={Wrench} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Derniers biens enregistrés
            </h2>

            <div className="mt-5 divide-y divide-[#DCEAF5]">
              {recentAssets.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Aucun bien enregistré.
                </p>
              ) : (
                recentAssets.map((asset: any) => (
                  <div key={asset.id} className="grid gap-3 py-4 md:grid-cols-[1fr_150px_120px] md:items-center">
                    <div>
                      <p className="font-extrabold text-[#03357A]">{asset.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {asset.category} · {asset.condition}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{asset.status}</p>
                    <Link href={`/patrimony/assets/${asset.id}`} className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-2 text-xs font-extrabold text-[#03357A]">
                      Voir
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Alertes patrimoine
            </h2>

            <div className="mt-5 space-y-3">
              <AlertLine label="Biens endommagés / hors service" value={damagedCount} />
              <AlertLine label="Maintenances ouvertes" value={maintenanceRows.length} />
              <AlertLine label="Mouvements récents" value={movementRows.length} />
            </div>

            <div className="mt-6 grid gap-3">
              <Link href="/patrimony/assets" className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                Voir l’inventaire
              </Link>
              <Link href="/patrimony/maintenance" className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                Voir les maintenances
              </Link>
              <Link href="/patrimony/movements" className="rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                Voir les mouvements
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#03357A]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#03357A]">{value}</p>
    </div>
  );
}

function AlertLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#F8FBFD] p-4">
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-sm font-black text-[#03357A]">
        {value}
      </span>
    </div>
  );
}
