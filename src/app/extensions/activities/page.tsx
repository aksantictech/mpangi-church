import Link from "next/link";
import { Activity, CheckCircle2, Plus, UsersRound } from "lucide-react";
import { requireChurchModuleAccess } from "@/lib/security/access";
import ExtensionPageHeader from "@/components/extensions/ExtensionPageHeader";
import ExtensionStatusBadge from "@/components/extensions/ExtensionStatusBadge";
import { formatDateFr, formatMoney, getCurrentWeekRange } from "@/lib/extensions/dates";
import { validateExtensionActivityAction } from "../actions";

export default async function ExtensionActivitiesPage() {
  const { admin, churchId } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const { weekStart, weekEnd } = getCurrentWeekRange();

  const { data: activities } = await admin
    .from("extension_weekly_activities")
    .select("*, church_extensions(name, city)")
    .eq("church_id", churchId)
    .order("activity_date", { ascending: false })
    .limit(80);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <ExtensionPageHeader
        icon={Activity}
        title="Activités hebdomadaires"
        description="Consultez les rapports transmis par les extensions : participants, nouveaux convertis, nouveaux venus, recettes et dépenses."
        action={
          <Link
            href="/extensions/activities/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A]"
          >
            <Plus className="h-4 w-4" />
            Ajouter activité
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-xl font-black text-[#03357A]">
            Activités déclarées
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Semaine courante : {weekStart} au {weekEnd}
          </p>
        </div>
        <Link
          href="/extensions/reports"
          className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]"
        >
          Voir la synthèse
        </Link>
      </div>

      <section className="grid gap-3 md:hidden">
        {(activities ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-white p-6 text-center">
            <p className="font-black text-[#03357A]">Aucune activité</p>
            <p className="mt-2 text-sm text-slate-500">
              Ajoutez la première activité hebdomadaire.
            </p>
          </div>
        ) : (
          (activities ?? []).map((activity: any) => (
            <article
              key={activity.id}
              className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-black text-[#03357A]">
                    {activity.church_extensions?.name || "Extension"}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {activity.activity_type} · {formatDateFr(activity.activity_date)}
                  </p>
                </div>
                <ExtensionStatusBadge status={activity.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8FBFD] p-3">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Participants
                  </p>
                  <p className="mt-1 font-black text-[#03357A]">
                    {activity.total_participants || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Nouveaux
                  </p>
                  <p className="mt-1 font-black text-[#03357A]">
                    {activity.new_visitors_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Convertis
                  </p>
                  <p className="mt-1 font-black text-[#03357A]">
                    {activity.new_converts_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Solde
                  </p>
                  <p className="mt-1 font-black text-[#03357A]">
                    {formatMoney(activity.balance_amount, activity.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {activity.status !== "validated" && (
                  <form action={validateExtensionActivityAction}>
                    <input type="hidden" name="id" value={activity.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-extrabold text-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Valider
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="hidden overflow-x-auto rounded-3xl border border-[#DCEAF5] bg-white shadow-sm md:block">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-[#F8FBFD] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Extension</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Nouveaux convertis</th>
              <th className="px-4 py-3">Nouveaux venus</th>
              <th className="px-4 py-3">Recettes</th>
              <th className="px-4 py-3">Dépenses</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCEAF5]">
            {(activities ?? []).map((activity: any) => (
              <tr key={activity.id} className="text-slate-700">
                <td className="px-4 py-4 font-bold">
                  {formatDateFr(activity.activity_date)}
                </td>
                <td className="px-4 py-4 font-black text-[#03357A]">
                  {activity.church_extensions?.name || "-"}
                </td>
                <td className="px-4 py-4">{activity.activity_type}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 font-black">
                    <UsersRound className="h-4 w-4 text-[#03357A]" />
                    {activity.total_participants || 0}
                  </span>
                </td>
                <td className="px-4 py-4">{activity.new_converts_count || 0}</td>
                <td className="px-4 py-4">{activity.new_visitors_count || 0}</td>
                <td className="px-4 py-4">
                  {formatMoney(activity.income_amount, activity.currency)}
                </td>
                <td className="px-4 py-4">
                  {formatMoney(activity.expense_amount, activity.currency)}
                </td>
                <td className="px-4 py-4">
                  <ExtensionStatusBadge status={activity.status} />
                </td>
                <td className="px-4 py-4 text-right">
                  {activity.status !== "validated" ? (
                    <form action={validateExtensionActivityAction}>
                      <input type="hidden" name="id" value={activity.id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700"
                      >
                        Valider
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
