"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Bot, Search, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Chart = {
  type: "bar" | "line" | "pie";
  title: string;
  labels: string[];
  values: number[];
};

type Result = {
  answer: string;
  highlights: string[];
  chart: Chart | null;
  sources: Array<{ label: string; href: string }>;
  suggestions: string[];
  mode: "ai" | "local";
};

export default function ChurchSearchAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function runSearch(value: string) {
    if (value.trim().length < 2) return;
    setLoading(true);
    setError("");
    setQuery(value);

    try {
      const response = await fetch("/api/assistant/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analyse impossible.");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analyse impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  const chartData = result?.chart
    ? result.chart.labels.map((label, index) => ({
        label,
        value: result.chart?.values[index] ?? 0,
      }))
    : [];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex. Compare la complétude des rapports, montre les membres par département, analyse les âmes reçues…"
              className="h-14 w-full rounded-2xl border border-[#DCEAF5] pl-12 pr-4 outline-none focus:border-[#03357A] focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <button
            disabled={loading || query.trim().length < 2}
            className="rounded-2xl bg-[#03357A] px-6 py-3 font-black text-white disabled:opacity-60"
          >
            {loading ? "Analyse des données…" : "Analyser"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {(result?.suggestions || [
            "Montre la répartition des membres par département",
            "Analyse la complétude des rapports des 6 derniers mois",
            "Quelle est l’évolution des âmes suivies ?",
            "Quelles tâches nécessitent une attention ?",
          ]).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => runSearch(suggestion)}
              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#03357A] hover:bg-blue-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}

      {result && (
        <>
          <section className="rounded-3xl bg-gradient-to-r from-violet-50 to-blue-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              {result.mode === "ai" ? (
                <Bot className="h-7 w-7 shrink-0 text-violet-600" />
              ) : (
                <Sparkles className="h-7 w-7 shrink-0 text-violet-600" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black text-[#03357A]">Réponse structurée</h2>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-violet-700">
                    {result.mode === "ai" ? "OpenAI + données autorisées" : "Analyse locale"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{result.answer}</p>

                {result.highlights.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {result.highlights.map((item) => (
                      <li key={item} className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700 shadow-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {result.chart && chartData.length > 0 && (
            <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
              <h3 className="font-black text-[#03357A]">{result.chart.title}</h3>
              <div className="mt-5 h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  {result.chart.type === "pie" ? (
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="label" outerRadius={115} label>
                        {chartData.map((_, index) => <Cell key={index} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : result.chart.type === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" strokeWidth={3} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {result.sources.length > 0 && (
            <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
              <h3 className="font-black text-[#03357A]">Données sources</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.sources.map((source) => (
                  <Link
                    key={`${source.label}-${source.href}`}
                    href={source.href}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-black text-[#03357A]"
                  >
                    {source.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
