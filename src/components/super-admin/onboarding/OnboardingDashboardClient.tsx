"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

type Summary = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  city: string | null;
  country: string | null;
  totalSteps: number;
  doneSteps: number;
  blockedSteps: number;
  progress: number;
};

function statusLabel(status: string | null) {
  if (status === "active") return "Active";
  if (status === "archived") return "Archivée";
  if (status === "inactive") return "Inactive";

  return status || "Non défini";
}

export default function OnboardingDashboardClient({
  initialChurches,
}: {
  initialChurches: Summary[];
}) {
  const [churches, setChurches] = useState(initialChurches);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);

    try {
      const response = await fetch("/api/super-admin/onboarding", {
        cache: "no-store",
      });
      const payload = await response.json();

      setChurches(payload.churches ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setChurches(initialChurches);
  }, [initialChurches]);

  const filteredChurches = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return churches;

    return churches.filter((church) =>
      [church.name, church.slug, church.city, church.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [churches, query]);

  const total = churches.length;
  const ready = churches.filter((church) => church.progress === 100).length;
  const blocked = churches.filter((church) => church.blockedSteps > 0).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <Building2 className="h-7 w-7 text-[#03357A]" />
          <p className="mt-4 text-sm font-bold text-slate-500">Églises</p>
          <p className="mt-1 text-3xl font-black text-[#03357A]">{total}</p>
        </article>

        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Prêtes</p>
          <p className="mt-1 text-3xl font-black text-[#03357A]">{ready}</p>
        </article>

        <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <AlertTriangle className="h-7 w-7 text-orange-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">Bloquées</p>
          <p className="mt-1 text-3xl font-black text-[#03357A]">{blocked}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block md:w-[420px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une église..."
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] pl-11 pr-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Synchroniser
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredChurches.map((church) => (
          <article
            key={church.id}
            className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-lg font-black text-[#03357A]">
                  {church.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  /{church.slug}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {church.city || "-"} {church.country ? `• ${church.country}` : ""}
                </p>
              </div>

              <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                {statusLabel(church.status)}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-[#03357A]">Progression</span>
                <span className={church.progress === 100 ? "text-green-700" : "text-slate-500"}>
                  {church.progress}%
                </span>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#EAF3FA]">
                <div
                  className={`h-full rounded-full ${
                    church.progress === 100 ? "bg-green-500" : "bg-[#03357A]"
                  }`}
                  style={{ width: `${church.progress}%` }}
                />
              </div>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {church.doneSteps}/{church.totalSteps} étapes validées
                {church.blockedSteps > 0 ? ` • ${church.blockedSteps} bloquée(s)` : ""}
              </p>
            </div>

            <Link
              href={`/super-admin/churches/${church.id}/onboarding`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
            >
              Gérer l’onboarding
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
