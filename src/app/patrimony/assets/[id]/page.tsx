import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  PackageCheck,
  Pencil,
  UserRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatSize(value?: number | null) {
  if (!value) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function PatrimonyAssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;
  const { admin, profile } = await requireChurchModuleAccess("assets");

  const [{ data: asset }, { data: maintenance }, { data: movements }] = await Promise.all([
    admin
      .from("patrimony_assets")
      .select(
        `
        *,
        department:departments(name),
        responsible:profiles!patrimony_assets_responsible_id_fkey(full_name, role)
        `
      )
      .eq("church_id", profile.church_id)
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("patrimony_asset_maintenance")
      .select("id, title, status, planned_date, completed_date, cost, currency")
      .eq("church_id", profile.church_id)
      .eq("asset_id", id)
      .order("created_at", { ascending: false })
      .limit(10),

    admin
      .from("patrimony_asset_movements")
      .select("id, movement_type, movement_date, to_location, status, quantity")
      .eq("church_id", profile.church_id)
      .eq("asset_id", id)
      .order("movement_date", { ascending: false })
      .limit(10),
  ]);

  if (!asset) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/patrimony/assets" className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]">
            <ArrowLeft className="h-4 w-4" />
            Retour à l’inventaire
          </Link>

          <Link href={`/patrimony/assets/${asset.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                {CATEGORY_LABELS[asset.category] || asset.category}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">{asset.name}</h1>
              <p className="mt-2 text-sm leading-7 text-blue-50">
                Code : {asset.asset_code || "-"} · Statut : {STATUS_LABELS[asset.status] || asset.status}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/20">
              <p className="text-2xl font-black">
                {money(Number(asset.current_value ?? asset.acquisition_value ?? 0), asset.currency || "CDF")}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-100">Valeur estimée</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard label="État" value={CONDITION_LABELS[asset.condition] || asset.condition} icon={PackageCheck} />
          <InfoCard label="Quantité" value={`${asset.quantity} ${asset.unit || ""}`} icon={PackageCheck} />
          <InfoCard label="Département" value={asset.department?.name || "-"} icon={UserRound} />
          <InfoCard label="Acquisition" value={formatDate(asset.acquisition_date)} icon={CalendarDays} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">Détails du bien</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Detail label="Marque" value={asset.brand} />
              <Detail label="Modèle" value={asset.model} />
              <Detail label="Numéro de série" value={asset.serial_number} />
              <Detail label="Référence achat" value={asset.purchase_reference} />
              <Detail label="Localisation" value={asset.location} />
              <Detail label="Responsable" value={asset.responsible?.full_name || "-"} />
              <Detail label="Valeur achat" value={asset.acquisition_value ? money(Number(asset.acquisition_value), asset.currency) : "-"} />
              <Detail label="Valeur actuelle" value={asset.current_value ? money(Number(asset.current_value), asset.currency) : "-"} />
            </div>

            <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {asset.description || "-"}
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5">
              <h3 className="font-extrabold text-[#03357A]">Document lié</h3>

              {asset.document_path ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">{asset.document_name || "Document"}</p>
                    <p className="mt-1 text-sm text-slate-500">{asset.document_mime_type || "Fichier"} · {formatSize(asset.document_size)}</p>
                  </div>

                  <a href={getDocumentDownloadHref({ path: asset.document_path, filename: asset.document_name || asset.name })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Aucun fichier chargé.</p>
              )}

              {asset.document_url && (
                <a href={asset.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]">
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le lien externe
                </a>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <ListBlock title="Dernières maintenances" rows={maintenance ?? []} kind="maintenance" />
            <ListBlock title="Derniers mouvements" rows={movements ?? []} kind="movement" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-[#03357A]" />
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-extrabold text-[#03357A]">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{value || "-"}</p>
    </div>
  );
}

function ListBlock({ title, rows, kind }: { title: string; rows: any[]; kind: string }) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#03357A]">{title}</h2>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun enregistrement.</p>
        ) : (
          rows.map((row: any) => (
            <div key={row.id} className="rounded-2xl bg-[#F8FBFD] p-4">
              <p className="font-extrabold text-[#03357A]">{kind === "maintenance" ? row.title : row.movement_type}</p>
              <p className="mt-1 text-sm text-slate-500">{kind === "maintenance" ? row.status : `${row.movement_date} · ${row.status}`}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
