import {
  Eye,
  Globe2,
  LogIn,
  MapPin,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function validDate(value: string, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function rank(values: Array<string | null | undefined>, limit = 10) {
  const map = new Map<string, number>();
  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!value) continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function geoFromMetadata(metadata: any) {
  const geo = metadata?.geo;
  return {
    country: String(geo?.country || ""),
    region: String(geo?.region || ""),
    city: String(geo?.city || ""),
  };
}

export default async function SuperAdminAnalyticsPage({ searchParams }: Props) {
  await requireSuperAdminAccess();
  const sp = searchParams ? await searchParams : {};

  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = addDays(today, -29);
  const from = validDate(one(sp.from), defaultFrom);
  const to = validDate(one(sp.to), today);
  const until = addDays(to, 1);
  const hostFilter = one(sp.host).trim();
  const countryFilter = one(sp.country).trim().toUpperCase();
  const cityFilter = one(sp.city).trim();
  const pageFilter = one(sp.page).trim();
  const areaFilter = one(sp.area).trim();

  const admin = createAdminClient();

  let eventQuery = admin
    .from("site_analytics_events")
    .select(
      "created_at,host,path,area,visitor_hash,country_code,region,city,referrer_host"
    )
    .eq("event_type", "page_view")
    .eq("is_bot", false)
    .gte("created_at", `${from}T00:00:00Z`)
    .lt("created_at", `${until}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (hostFilter) eventQuery = eventQuery.eq("host", hostFilter);
  if (countryFilter) eventQuery = eventQuery.eq("country_code", countryFilter);
  if (cityFilter) eventQuery = eventQuery.ilike("city", `%${cityFilter}%`);
  if (pageFilter) eventQuery = eventQuery.ilike("path", `%${pageFilter}%`);
  if (areaFilter) eventQuery = eventQuery.eq("area", areaFilter);

  const [{ data: pageEvents, error: pageError }, { data: loginRows, error: loginError }] =
    await Promise.all([
      eventQuery,
      admin
        .from("security_audit_logs")
        .select("created_at,action,status,actor_email,ip_address,metadata")
        .in("action", ["login.success", "login.failed"])
        .gte("created_at", `${from}T00:00:00Z`)
        .lt("created_at", `${until}T00:00:00Z`)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

  if (pageError) console.error("Analytics events load failed", pageError.message);
  if (loginError) console.error("Analytics login load failed", loginError.message);

  const events = pageEvents || [];
  const rawLogins = loginRows || [];
  const filteredLogins = rawLogins.filter((item: any) => {
    const geo = geoFromMetadata(item.metadata);
    if (countryFilter && geo.country.toUpperCase() !== countryFilter) return false;
    if (cityFilter && !geo.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  const uniqueVisitors = new Set(events.map((item: any) => item.visitor_hash)).size;
  const loginAttempts = filteredLogins.length;
  const loginSuccesses = filteredLogins.filter(
    (item: any) => item.action === "login.success"
  ).length;
  const loginFailures = filteredLogins.filter(
    (item: any) => item.action === "login.failed"
  ).length;

  const topPages = rank(events.map((item: any) => item.path));
  const topCountries = rank(events.map((item: any) => item.country_code || "Inconnu"));
  const topCities = rank(events.map((item: any) => item.city || "Inconnue"));
  const hosts = rank(events.map((item: any) => item.host), 50).map(([value]) => value);
  const countries = rank(events.map((item: any) => item.country_code), 100).map(([value]) => value);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.25em] text-blue-100">
            Audience & sécurité
          </p>
          <h1 className="mt-3 text-3xl font-black">Visites du site</h1>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-blue-50">
            Suivez les pages consultées, visiteurs uniques, localisations approximatives
            et tentatives de connexion à la plateforme.
          </p>
        </section>

        <form className="grid gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-7">
          <input type="date" name="from" defaultValue={from} className="filter-input" />
          <input type="date" name="to" defaultValue={to} className="filter-input" />
          <select name="host" defaultValue={hostFilter} className="filter-input">
            <option value="">Tous les domaines</option>
            {hosts.map((host) => <option key={host} value={host}>{host}</option>)}
          </select>
          <select name="country" defaultValue={countryFilter} className="filter-input">
            <option value="">Tous les pays</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
          <input name="city" defaultValue={cityFilter} placeholder="Ville" className="filter-input" />
          <input name="page" defaultValue={pageFilter} placeholder="Page / chemin" className="filter-input" />
          <select name="area" defaultValue={areaFilter} className="filter-input">
            <option value="">Toutes les zones</option>
            <option value="public">Public</option>
            <option value="login">Connexion</option>
            <option value="authenticated">Espace connecté</option>
          </select>
          <button className="rounded-2xl bg-[#03357A] px-5 py-3 font-black text-white xl:col-span-7 xl:justify-self-end">
            Filtrer
          </button>
        </form>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Pages vues" value={events.length} description="Chargements de pages hors robots" icon={Eye} accent="blue" />
          <MetricCard title="Visiteurs uniques" value={uniqueVisitors} description="Empreinte journalière pseudonymisée" icon={UsersRound} accent="purple" />
          <MetricCard title="Tentatives de connexion" value={loginAttempts} description={`${loginFailures} échec(s)`} icon={ShieldAlert} accent="orange" />
          <MetricCard title="Connexions réussies" value={loginSuccesses} description="Authentifications réussies" icon={LogIn} accent="green" />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <RankCard title="Pages les plus vues" icon={Eye} rows={topPages} />
          <RankCard title="Pays" icon={Globe2} rows={topCountries} />
          <RankCard title="Villes" icon={MapPin} rows={topCities} />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">Connexions et tentatives récentes</h2>
              <p className="mt-1 text-sm text-slate-500">
                L’adresse IP brute est affichée uniquement pour les événements de sécurité de connexion.
              </p>
            </div>
            <span className="rounded-full bg-[#EAF3FA] px-4 py-2 text-sm font-black text-[#03357A]">
              {filteredLogins.length} événement(s)
            </span>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Compte</th>
                  <th className="px-4 py-3">Adresse IP</th>
                  <th className="px-4 py-3">Localisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCEAF5]">
                {filteredLogins.slice(0, 100).map((item: any, index: number) => {
                  const geo = geoFromMetadata(item.metadata);
                  const success = item.action === "login.success";
                  return (
                    <tr key={`${item.created_at}-${index}`}>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {success ? "Réussie" : "Échec"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{item.actor_email || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.ip_address || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {[geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogins.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Aucune tentative sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Les visites ordinaires ne conservent pas l’adresse IP brute : elle est transformée en empreinte journalière pseudonymisée pour compter les visiteurs uniques. Les IP brutes restent limitées au journal de sécurité des connexions.
        </div>
      </div>
    </SuperAdminShell>
  );
}

function RankCard({ title, icon: Icon, rows }: { title: string; icon: any; rows: Array<[string, number]> }) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]"><Icon className="h-5 w-5" /></span>
        <h2 className="font-black text-[#03357A]">{title}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {rows.length ? rows.map(([label, count], index) => (
          <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FBFD] px-4 py-3">
            <span className="min-w-0 truncate text-sm font-bold text-slate-700">{label}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#03357A]">{count}</span>
          </div>
        )) : <p className="rounded-2xl bg-[#F8FBFD] p-4 text-sm text-slate-500">Aucune donnée.</p>}
      </div>
    </article>
  );
}
