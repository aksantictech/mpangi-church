import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

type PageProps = {
  searchParams: Promise<{ status?: string; severity?: string }>;
};

const ADMIN_ROLES = new Set([
  "super_admin","church_admin","admin_eglise","pasteur_t","pastor",
]);

export const dynamic = "force-dynamic";

export default async function SecurityAuditPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const context = await getCurrentSecurityContext();

  if (!ADMIN_ROLES.has(context.role)) {
    redirect("/unauthorized?reason=security_audit");
  }

  const admin = createAdminClient();

  let query = admin
    .from("security_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (context.role !== "super_admin" && context.churchId) {
    query = query.eq("church_id", context.churchId);
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.severity) query = query.eq("severity", filters.severity);

  const { data, error } = await query;
  const rows = data || [];

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <ShieldCheck className="h-8 w-8" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Sécurité
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Journal des actions sensibles
          </h1>
          <p className="mt-3 text-sm leading-7 text-blue-50">
            Accès refusés, erreurs et opérations sensibles.
          </p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
          <select name="status" defaultValue={filters.status || ""} className="min-h-11 rounded-xl border border-[#DCEAF5] px-3">
            <option value="">Tous les statuts</option>
            <option value="success">Succès</option>
            <option value="denied">Refusé</option>
            <option value="error">Erreur</option>
            <option value="warning">Alerte</option>
          </select>
          <select name="severity" defaultValue={filters.severity || ""} className="min-h-11 rounded-xl border border-[#DCEAF5] px-3">
            <option value="">Toutes les sévérités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Élevée</option>
            <option value="critical">Critique</option>
          </select>
          <button className="min-h-11 rounded-xl bg-[#03357A] px-5 text-sm font-black text-white">
            Filtrer
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error.message}
          </div>
        )}

        <section className="mt-5 grid gap-3">
          {rows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-8 text-center text-sm font-bold text-slate-500">
              Aucun événement.
            </div>
          ) : (
            rows.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{item.status}</span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{item.severity}</span>
                    </div>
                    <h2 className="mt-3 break-words font-black text-[#03357A]">{item.action}</h2>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      {item.actor_email || "Acteur inconnu"}{item.actor_role ? ` Â· ${item.actor_role}` : ""}
                    </p>
                    {item.route && <p className="mt-1 break-all text-xs text-slate-400">{item.route}</p>}
                  </div>
                  <time className="text-xs font-bold text-slate-400">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </time>
                </div>
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
