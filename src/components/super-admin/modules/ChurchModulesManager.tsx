"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type AdminModuleRow = {
  code: string;
  name: string;
  category: string;
  description?: string | null;
  sort_order?: number | null;
  is_core?: boolean | null;
  is_active?: boolean | null;
  is_enabled: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  system: "Général",
  spiritual: "Spirituel",
  administration: "Administration",
  finance: "Finances",
  patrimony: "Patrimoine",
};

export default function ChurchModulesManager({
  churchId,
}: {
  churchId: string;
}) {
  const [modules, setModules] = useState<AdminModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  const enabledCount = modules.filter((module) => module.is_enabled).length;

  const groupedModules = useMemo(() => {
    return modules.reduce<Record<string, AdminModuleRow[]>>((acc, module) => {
      const key = module.category || "autres";

      if (!acc[key]) acc[key] = [];
      acc[key].push(module);

      return acc;
    }, {});
  }, [modules]);

  async function loadModules() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/super-admin/church-modules?churchId=${encodeURIComponent(
          churchId
        )}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Chargement impossible.");
      }

      setModules(payload.modules || []);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string, extra?: Record<string, unknown>) {
    setBusyAction(action);
    setErrorMessage("");

    try {
      const response = await fetch("/api/super-admin/church-modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          churchId,
          action,
          ...extra,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Action impossible.");
      }

      setModules(payload.modules || []);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur.");
    } finally {
      setBusyAction("");
    }
  }

  useEffect(() => {
    loadModules();
  }, [churchId]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
              Modules église
            </p>
            <h1 className="mt-3 text-3xl font-black">
              Activation des modules
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
              Stabilisez les modules de cette église, synchronisez les permissions
              et activez tout en un clic.
            </p>
          </div>

          <div className="rounded-3xl bg-white/15 p-4 text-center">
            <p className="text-4xl font-black">
              {enabledCount}/{modules.length}
            </p>
            <p className="text-sm font-bold text-blue-100">modules actifs</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <button
            type="button"
            onClick={() => runAction("enable_all")}
            disabled={Boolean(busyAction)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {busyAction === "enable_all" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            Tout activer
          </button>

          <button
            type="button"
            onClick={() => runAction("sync")}
            disabled={Boolean(busyAction)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 py-3 text-sm font-black text-[#03357A] disabled:opacity-60"
          >
            {busyAction === "sync" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            Synchroniser
          </button>

          <button
            type="button"
            onClick={() => runAction("disable_optional")}
            disabled={Boolean(busyAction)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-50 px-5 py-3 text-sm font-black text-orange-700 disabled:opacity-60"
          >
            <Power className="h-5 w-5" />
            Désactiver optionnels
          </button>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          Le bouton <strong>Tout activer</strong> active les modules et remet
          automatiquement les permissions de lecture liées à cette église.
        </p>

        {errorMessage && (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        )}
      </section>

      {loading ? (
        <div className="rounded-3xl border border-[#DCEAF5] bg-white p-8 text-center text-sm font-black text-[#03357A]">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Chargement des modules...
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedModules).map(([category, rows]) => (
            <section
              key={category}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#03357A]">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {rows.filter((row) => row.is_enabled).length}/{rows.length} actifs
                  </p>
                </div>

                <ShieldCheck className="h-6 w-6 text-[#03357A]" />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((module) => (
                  <article
                    key={module.code}
                    className={`rounded-3xl border p-4 transition ${
                      module.is_enabled
                        ? "border-green-100 bg-green-50"
                        : "border-[#DCEAF5] bg-[#F8FBFD]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-[#03357A]">
                          {module.name}
                        </h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {module.code}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(busyAction) || Boolean(module.is_core)}
                        onClick={() =>
                          runAction("set", {
                            moduleCode: module.code,
                            enabled: !module.is_enabled,
                          })
                        }
                        className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-black ${
                          module.is_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        } disabled:opacity-60`}
                        title={module.is_core ? "Module obligatoire" : "Activer / désactiver"}
                      >
                        {module.is_enabled ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    </div>

                    {module.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {module.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {module.is_core && (
                        <span className="rounded-full bg-[#03357A] px-3 py-1 text-xs font-black text-white">
                          Obligatoire
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          module.is_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {module.is_enabled ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
