import Link from "next/link";
import { Activity, Download, FileSpreadsheet, Search, ShieldCheck } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { getAuditRows, type AuditFilters } from "@/lib/audit/auditQuery";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  searchParams: Promise<AuditFilters>;
};

function buildExportUrl(format: "xlsx" | "pdf", filters: AuditFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `/api/super-admin/audit-logs/export/${format}?${params.toString()}`;
}

function churchName(row: any) {
  const church = Array.isArray(row.churches) ? row.churches[0] : row.churches;
  return church?.name || "Plateforme";
}

export default async function AuditLogsPage({ searchParams }: Props) {
  await requireSuperAdmin();
  const filters = await searchParams;
  const admin = createAdminClient();
  const [{ data: churches }, rows] = await Promise.all([
    admin.from("churches").select("id, name").order("name"),
    getAuditRows(filters, 500),
  ]);

  return (
    <SuperAdminShell>
      <div className="space-y-5">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Super Admin uniquement</p>
                <h1 className="mt-2 text-3xl font-black">Journal d’audit</h1>
                <p className="mt-2 text-sm text-blue-50">Connexions, accès, modifications, validations et exports de toute la plateforme.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={buildExportUrl("xlsx", filters)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#03357A]">
                <FileSpreadsheet className="h-4 w-4" /> Exporter XLSX
              </Link>
              <Link href={buildExportUrl("pdf", filters)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black text-white">
                <Download className="h-4 w-4" /> Télécharger PDF
              </Link>
            </div>
          </div>
        </section>

        <form className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-7">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input name="q" defaultValue={filters.q} placeholder="Email, action, route…" className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" />
          </label>
          <select name="church" defaultValue={filters.church || ""} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">Toutes les églises</option>
            {(churches ?? []).map((church) => <option key={church.id} value={church.id}>{church.name}</option>)}
          </select>
          <select name="category" defaultValue={filters.category || ""} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">Toutes catégories</option>
            <option value="authentication">Authentification</option>
            <option value="account_request">Demandes de compte</option>
            <option value="data_change">Modifications</option>
            <option value="export">Exports</option>
            <option value="security">Sécurité</option>
          </select>
          <select name="status" defaultValue={filters.status || ""} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="">Tous résultats</option>
            <option value="success">Succès</option>
            <option value="denied">Refusé</option>
            <option value="error">Erreur</option>
            <option value="warning">Avertissement</option>
          </select>
          <input type="date" name="from" defaultValue={filters.from} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm" />
          <div className="flex gap-2">
            <input type="date" name="to" defaultValue={filters.to} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm" />
            <button className="min-h-11 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white">Filtrer</button>
          </div>
        </form>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <p className="font-black text-[#03357A]">{rows.length} événement(s) affiché(s)</p>
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#F5F9FC] text-xs uppercase text-slate-500">
                <tr>{["Date", "Église", "Utilisateur", "Action", "Ressource", "Résultat", "IP", "Détails"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "medium" }).format(new Date(row.created_at))}</td>
                    <td className="px-4 py-3 font-bold">{churchName(row)}</td>
                    <td className="px-4 py-3"><p className="font-bold">{row.actor_email || "Visiteur public"}</p><p className="text-xs text-slate-400">{row.actor_role || "—"}</p></td>
                    <td className="px-4 py-3"><p className="font-black text-[#03357A]">{row.action}</p><p className="text-xs text-slate-400">{row.event_category || "—"}</p></td>
                    <td className="px-4 py-3">{row.resource_type || "—"}{row.resource_id ? <p className="max-w-40 truncate text-xs text-slate-400">{row.resource_id}</p> : null}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${row.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{row.status}</span></td>
                    <td className="px-4 py-3 text-xs">{row.ip_address || "—"}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-500"><pre className="whitespace-pre-wrap font-sans">{JSON.stringify(row.metadata || {}, null, 2)}</pre></td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={8} className="p-10 text-center text-slate-500">Aucun événement pour ces filtres.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

