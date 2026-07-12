import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Banknote,
  HeartHandshake,
  UsersRound,
} from "lucide-react";
import { requireChurchModuleAccess } from "@/lib/security/access";
import ExtensionKpiCard from "@/components/extensions/ExtensionKpiCard";
import ExtensionPageHeader from "@/components/extensions/ExtensionPageHeader";
import { formatMoney, getCurrentWeekRange } from "@/lib/extensions/dates";

type ReportsSearchParams = {
  week_start?: string;
  week_end?: string;
};

type ReportsPageProps = {
  searchParams?: Promise<ReportsSearchParams>;
};

export default async function ExtensionReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const { admin, churchId } = await requireChurchModuleAccess("extension_activities");
  const currentWeek = getCurrentWeekRange();
  const weekStart = params?.week_start || currentWeek.weekStart;
  const weekEnd = params?.week_end || currentWeek.weekEnd;

  const { data: activities } = await admin
    .from("extension_weekly_activities")
    .select("*, church_extensions(id, name)")
    .eq("church_id", churchId)
    .gte("week_start", weekStart)
    .lte("week_end", weekEnd)
    .neq("status", "archived")
    .order("activity_date", { ascending: false });

  const rows = activities ?? [];

  const totals = rows.reduce(
    (acc: any, activity: any) => {
      acc.activities += 1;
      acc.men += Number(activity.men_count || 0);
      acc.women += Number(activity.women_count || 0);
      acc.children += Number(activity.children_count || 0);
      acc.participants += Number(activity.total_participants || 0);
      acc.converts += Number(activity.new_converts_count || 0);
      acc.visitors += Number(activity.new_visitors_count || 0);
      acc.income += Number(activity.income_amount || 0);
      acc.expenses += Number(activity.expense_amount || 0);
      return acc;
    },
    {
      activities: 0,
      men: 0,
      women: 0,
      children: 0,
      participants: 0,
      converts: 0,
      visitors: 0,
      income: 0,
      expenses: 0,
    }
  );

  const byExtension = Object.values(
    rows.reduce((acc: Record<string, any>, activity: any) => {
      const extensionId = activity.extension_id;
      const name = activity.church_extensions?.name || "Extension";

      if (!acc[extensionId]) {
        acc[extensionId] = {
          id: extensionId,
          name,
          activities: 0,
          participants: 0,
          men: 0,
          women: 0,
          children: 0,
          converts: 0,
          visitors: 0,
          income: 0,
          expenses: 0,
        };
      }

      acc[extensionId].activities += 1;
      acc[extensionId].participants += Number(activity.total_participants || 0);
      acc[extensionId].men += Number(activity.men_count || 0);
      acc[extensionId].women += Number(activity.women_count || 0);
      acc[extensionId].children += Number(activity.children_count || 0);
      acc[extensionId].converts += Number(activity.new_converts_count || 0);
      acc[extensionId].visitors += Number(activity.new_visitors_count || 0);
      acc[extensionId].income += Number(activity.income_amount || 0);
      acc[extensionId].expenses += Number(activity.expense_amount || 0);

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.participants - a.participants);

  const balance = totals.income - totals.expenses;

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <ExtensionPageHeader
        icon={BarChart3}
        title="Synthèse des extensions"
        description="Vue pastorale consolidée : activités, participants, nouveaux convertis, nouveaux venus, recettes et dépenses."
        action={
          <Link
            href="/extensions/activities/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A]"
          >
            <ArrowUpRight className="h-4 w-4" />
            Nouvelle activité
          </Link>
        }
      />

      <form className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Début semaine</span>
            <input
              type="date"
              name="week_start"
              defaultValue={weekStart}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">Fin semaine</span>
            <input
              type="date"
              name="week_end"
              defaultValue={weekEnd}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#03357A] px-5 text-sm font-extrabold text-white"
          >
            Filtrer
          </button>
        </div>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExtensionKpiCard
          icon={Activity}
          label="Activités"
          value={totals.activities}
          description="Activités déclarées"
        />
        <ExtensionKpiCard
          icon={UsersRound}
          label="Participants"
          value={totals.participants}
          description={`Hommes ${totals.men} · Femmes ${totals.women} · Enfants ${totals.children}`}
        />
        <ExtensionKpiCard
          icon={HeartHandshake}
          label="Nouveaux fruits"
          value={totals.converts + totals.visitors}
          description={`Convertis ${totals.converts} · Nouveaux venus ${totals.visitors}`}
        />
        <ExtensionKpiCard
          icon={Banknote}
          label="Solde"
          value={formatMoney(balance, "CDF")}
          description={`Recettes ${formatMoney(totals.income, "CDF")} · Dépenses ${formatMoney(totals.expenses, "CDF")}`}
        />
      </section>

      <section className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-[#03357A]">
              Synthèse par extension
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Classement par nombre de participants.
            </p>
          </div>
          <Link
            href="/extensions/activities"
            className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]"
          >
            Voir le détail
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {byExtension.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-6 text-center">
              <p className="font-black text-[#03357A]">Aucune donnée</p>
              <p className="mt-2 text-sm text-slate-500">
                Aucun rapport soumis pour cette période.
              </p>
            </div>
          ) : (
            byExtension.map((row: any) => (
              <article key={row.id} className="rounded-3xl bg-[#F8FBFD] p-4">
                <h3 className="font-black text-[#03357A]">{row.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 text-sm">
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">Activités</p>
                    <p className="mt-1 font-black text-slate-700">{row.activities}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">Participants</p>
                    <p className="mt-1 font-black text-slate-700">{row.participants}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">Convertis</p>
                    <p className="mt-1 font-black text-slate-700">{row.converts}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">Solde</p>
                    <p className="mt-1 font-black text-slate-700">
                      {formatMoney(row.income - row.expenses, "CDF")}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[#DCEAF5] md:block">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#F8FBFD] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Extension</th>
                <th className="px-4 py-3">Activités</th>
                <th className="px-4 py-3">Hommes</th>
                <th className="px-4 py-3">Femmes</th>
                <th className="px-4 py-3">Enfants</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Convertis</th>
                <th className="px-4 py-3">Nouveaux venus</th>
                <th className="px-4 py-3">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCEAF5]">
              {byExtension.map((row: any) => (
                <tr key={row.id} className="text-slate-700">
                  <td className="px-4 py-4 font-black text-[#03357A]">{row.name}</td>
                  <td className="px-4 py-4">{row.activities}</td>
                  <td className="px-4 py-4">{row.men}</td>
                  <td className="px-4 py-4">{row.women}</td>
                  <td className="px-4 py-4">{row.children}</td>
                  <td className="px-4 py-4 font-black">{row.participants}</td>
                  <td className="px-4 py-4">{row.converts}</td>
                  <td className="px-4 py-4">{row.visitors}</td>
                  <td className="px-4 py-4 font-black">
                    {formatMoney(row.income - row.expenses, "CDF")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
