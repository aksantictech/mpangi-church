"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Bot, Search, Sparkles } from "lucide-react";

type Group = { type: string; label: string; href: string; rows: Record<string, unknown>[] };
type Result = { summary: string; mode: "ai" | "local"; total: number; groups: Group[]; suggestions: string[] };

export default function ChurchSearchAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function runSearch(value: string) {
    if (value.trim().length < 2) return;
    setLoading(true); setError(""); setQuery(value);
    try {
      const response = await fetch("/api/assistant/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: value }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Recherche impossible.");
      setResult(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Recherche impossible."); }
    finally { setLoading(false); }
  }
  async function submit(event: FormEvent) { event.preventDefault(); await runSearch(query); }
  const title = (row: Record<string, unknown>) => String(row.title || row.name || [row.first_name, row.last_name].filter(Boolean).join(" ") || "Résultat");
  const detail = (row: Record<string, unknown>) => [row.status, row.event_date || row.due_date || row.transaction_date, row.location || row.category].filter(Boolean).join(" · ");

  return <div className="space-y-5">
    <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Posez une question sur les membres, activités, tâches, finances ou patrimoine…" className="h-14 w-full rounded-2xl border border-[#DCEAF5] pl-12 pr-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-blue-100"/></div>
        <button disabled={loading || query.trim().length < 2} className="rounded-2xl bg-[#03357A] px-6 py-3 font-black text-white disabled:opacity-60">{loading ? "Analyse…" : "Demander"}</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">{(result?.suggestions || ["Tâches en retard", "Événements de ce mois", "Biens en maintenance", "Résumé général"]).map((suggestion) => <button key={suggestion} type="button" onClick={() => runSearch(suggestion)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#03357A] hover:bg-blue-100">{suggestion}</button>)}</div>
    </section>
    {error && <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
    {result && <>
      <section className="rounded-3xl bg-gradient-to-r from-violet-50 to-blue-50 p-5 sm:p-6"><div className="flex items-start gap-3">{result.mode === "ai" ? <Bot className="h-7 w-7 shrink-0 text-violet-600"/> : <Sparkles className="h-7 w-7 shrink-0 text-violet-600"/>}<div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#03357A]">Synthèse de l’assistant</h2><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-violet-700">{result.mode === "ai" ? "IA activée" : "Analyse locale"}</span></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{result.summary}</p><p className="mt-3 text-xs text-slate-500">Réponse fondée uniquement sur les données accessibles de votre église. Vérifiez les fiches sources avant toute décision.</p></div></div></section>
      <div className="grid gap-4 lg:grid-cols-2">{result.groups.filter((group) => group.rows.length).map((group) => <section key={group.type} className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-[#03357A]">{group.label}</h3><p className="mt-1 text-xs text-slate-500">{group.rows.length} source(s) correspondante(s)</p></div><Link href={group.href} className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">Tout voir <ArrowRight className="h-4 w-4"/></Link></div><div className="mt-4 space-y-2">{group.rows.map((row, index) => <div key={String(row.id || index)} className="rounded-xl bg-[#F8FBFD] p-3"><p className="break-words font-bold text-slate-800">{title(row)}</p><p className="mt-1 text-xs text-slate-500">{detail(row) || "Fiche disponible"}</p></div>)}</div></section>)}</div>
    </>}
  </div>;
}
