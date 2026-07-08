import Link from "next/link";
import { Archive, Download, FileText, Inbox, MailPlus, Search, Send, ShieldAlert } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getDocumentDownloadHref } from "@/lib/storage/churchDocuments";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";

type Props = { searchParams?: Promise<{ q?: string; type?: string; status?: string; priority?: string; dateFrom?: string; dateTo?: string }> };

const TYPE: Record<string,string> = { incoming: "Entrant", outgoing: "Sortant", internal: "Interne" };
const STATUS: Record<string,string> = { draft: "Brouillon", received: "Reçu", sent: "Envoyé", in_review: "En traitement", transmitted: "Transmis", closed: "Clôturé", archived: "Archivé" };
const PRIORITY: Record<string,string> = { low: "Faible", normal: "Normale", high: "Haute", urgent: "Urgente" };
const filterClass = "min-h-12 rounded-2xl border border-[#DCEAF5] bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); } catch { return String(value); }
}

function statusClass(status: string) {
  if (status === "closed" || status === "archived") return "bg-slate-100 text-slate-700";
  if (status === "sent" || status === "transmitted") return "bg-blue-50 text-blue-700";
  if (status === "in_review") return "bg-orange-50 text-orange-700";
  return "bg-green-50 text-green-700";
}

function priorityClass(priority: string) {
  if (priority === "urgent") return "bg-red-50 text-red-700";
  if (priority === "high") return "bg-orange-50 text-orange-700";
  if (priority === "low") return "bg-slate-100 text-slate-600";
  return "bg-[#EAF3FA] text-[#03357A]";
}

export default async function CorrespondencePage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const q = (sp.q || "").trim();
  const type = sp.type || "";
  const status = sp.status || "";
  const priority = sp.priority || "";
  const dateFrom = sp.dateFrom || "";
  const dateTo = sp.dateTo || "";
  const { admin, profile } = await requireChurchModuleAccess("correspondence");

  let query = admin
    .from("admin_correspondences")
    .select("id, reference, type, subject, sender_name, recipient_name, priority, status, correspondence_date, confidential, document_path, document_name, document_url, created_at")
    .eq("church_id", profile.church_id)
    .order("correspondence_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (dateFrom) query = query.gte("correspondence_date", dateFrom);
  if (dateTo) query = query.lte("correspondence_date", dateTo);
  if (q) query = query.or(`reference.ilike.%${q}%,subject.ilike.%${q}%,sender_name.ilike.%${q}%,recipient_name.ilike.%${q}%`);

  const { data } = await query;
  const rows = data ?? [];
  const incoming = rows.filter((r:any)=>r.type === "incoming").length;
  const outgoing = rows.filter((r:any)=>r.type === "outgoing").length;
  const urgent = rows.filter((r:any)=>r.priority === "urgent").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Volet administratif</p><h1 className="mt-3 text-3xl font-extrabold">Gestion des courriers</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">Courriers entrants, sortants et internes avec fichiers joints et filtre par période.</p></div>
            <Link href="/administration/correspondence/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A]"><MailPlus className="h-4 w-4" />Nouveau courrier</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4"><Metric label="Total" value={rows.length} icon={FileText}/><Metric label="Entrants" value={incoming} icon={Inbox}/><Metric label="Sortants" value={outgoing} icon={Send}/><Metric label="Urgents" value={urgent} icon={ShieldAlert}/></section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 xl:grid-cols-[1fr_150px_150px_150px_155px_155px_auto]">
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input name="q" defaultValue={q} placeholder="Référence, objet, expéditeur..." className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10" /></div>
            <select name="type" defaultValue={type} className={filterClass}><option value="">Tous types</option><option value="incoming">Entrant</option><option value="outgoing">Sortant</option><option value="internal">Interne</option></select>
            <select name="status" defaultValue={status} className={filterClass}><option value="">Tous statuts</option><option value="received">Reçu</option><option value="sent">Envoyé</option><option value="in_review">En traitement</option><option value="transmitted">Transmis</option><option value="closed">Clôturé</option><option value="archived">Archivé</option></select>
            <select name="priority" defaultValue={priority} className={filterClass}><option value="">Priorités</option><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select>
            <input type="date" name="dateFrom" defaultValue={dateFrom} className={filterClass} title="Date début" />
            <input type="date" name="dateTo" defaultValue={dateTo} className={filterClass} title="Date fin" />
            <div className="flex gap-3"><button type="submit" className="rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white">Filtrer</button><Link href="/administration/correspondence" className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-extrabold text-[#03357A]">Reset</Link></div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="border-b border-[#DCEAF5] p-5"><h2 className="text-xl font-extrabold text-[#03357A]">Courriers enregistrés</h2><p className="mt-1 text-sm text-slate-500">{rows.length} courrier(s) affiché(s).</p></div>
          {rows.length === 0 ? <div className="p-10 text-center"><Archive className="mx-auto h-12 w-12 text-[#3F79B3]"/><p className="mt-4 font-extrabold text-[#03357A]">Aucun courrier trouvé.</p></div> : <div className="divide-y divide-[#DCEAF5]">{rows.map((row:any)=>(
            <div key={row.id} className="grid gap-4 p-5 transition hover:bg-[#F8FBFD] xl:grid-cols-[1fr_1.5fr_0.7fr_0.7fr_0.8fr_0.5fr]">
              <Link href={`/administration/correspondence/${row.id}`}><p className="text-xs font-black uppercase tracking-wide text-slate-400">Référence</p><p className="mt-1 font-extrabold text-[#03357A]">{row.reference}</p></Link>
              <Link href={`/administration/correspondence/${row.id}`}><p className="font-extrabold text-slate-800">{row.subject}</p><p className="mt-1 text-sm text-slate-500">{row.type === "incoming" ? row.sender_name || "Expéditeur non renseigné" : row.recipient_name || "Destinataire non renseigné"}</p>{(row.document_path || row.document_url) && <span className="mt-2 inline-flex rounded-full bg-[#EAF3FA] px-2 py-0.5 text-xs font-extrabold text-[#03357A]">Pièce jointe</span>}</Link>
              <div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Type</p><p className="mt-1 text-sm font-bold text-slate-700">{TYPE[row.type] || row.type}</p></div>
              <div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Statut</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(row.status)}`}>{STATUS[row.status] || row.status}</span></div>
              <div><p className="text-xs font-black uppercase tracking-wide text-slate-400">Priorité</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${priorityClass(row.priority)}`}>{PRIORITY[row.priority] || row.priority}</span><p className="mt-2 text-xs font-bold text-slate-400">{formatDate(row.correspondence_date)}</p></div>
              <div className="flex items-center justify-end">{row.document_path && <a href={getDocumentDownloadHref({ path: row.document_path, filename: row.document_name || row.reference })} className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-xs font-extrabold text-[#03357A]"><Download className="h-4 w-4"/>Fichier</a>}</div>
            </div>
          ))}</div>}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-[#03357A]">{value}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><Icon className="h-6 w-6" /></div></div></div>;
}
