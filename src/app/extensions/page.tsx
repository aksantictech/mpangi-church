import Link from "next/link";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarPlus,
  MapPin,
  Phone,
  Plus,
  UsersRound,
} from "lucide-react";
import { requireChurchModuleAccess } from "@/lib/security/access";
import ExtensionKpiCard from "@/components/extensions/ExtensionKpiCard";
import ExtensionPageHeader from "@/components/extensions/ExtensionPageHeader";
import ExtensionStatusBadge from "@/components/extensions/ExtensionStatusBadge";
import { getCurrentWeekRange } from "@/lib/extensions/dates";

export default async function ExtensionsPage() {
  const { admin, churchId } = await requireChurchModuleAccess(
    "extension_activities"
  );

  const { weekStart, weekEnd } = getCurrentWeekRange();

  const [{ data: extensions }, { data: weekActivities }] = await Promise.all([
    admin
      .from("church_extensions")
      .select("*")
      .eq("church_id", churchId)
      .neq("status", "archived")
      .order("name", { ascending: true }),

    admin
      .from("extension_weekly_activities")
      .select("total_participants, new_converts_count, new_visitors_count, income_amount, expense_amount")
      .eq("church_id", churchId)
      .gte("week_start", weekStart)
      .lte("week_end", weekEnd),
  ]);

  const totalExtensions = extensions?.length ?? 0;
  const activeExtensions = (extensions ?? []).filter(
    (extension: any) => extension.status === "active"
  ).length;
  const totalActivities = weekActivities?.length ?? 0;
  const participants = (weekActivities ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.total_participants || 0),
    0
  );

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <ExtensionPageHeader
        icon={Building2}
        title="Activités des extensions"
        description="Gérez les extensions de l’église et suivez leurs activités hebdomadaires sans surcharger les modules finances ou présences."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/extensions/activities/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A]"
            >
              <CalendarPlus className="h-4 w-4" />
              Ajouter activité
            </Link>
            <Link
              href="/extensions/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/30"
            >
              <Plus className="h-4 w-4" />
              Nouvelle extension
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExtensionKpiCard
          icon={Building2}
          label="Extensions"
          value={totalExtensions}
          description={`${activeExtensions} actives`}
        />
        <ExtensionKpiCard
          icon={Activity}
          label="Activités semaine"
          value={totalActivities}
          description={`${weekStart} au ${weekEnd}`}
        />
        <ExtensionKpiCard
          icon={UsersRound}
          label="Participants"
          value={participants}
          description="Cumul hommes + femmes + enfants"
        />
        <ExtensionKpiCard
          icon={BarChart3}
          label="Rapports"
          value="Voir"
          description="Synthèse hebdomadaire"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black text-[#03357A]">
                Liste des extensions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chaque extension peut soumettre ses activités de la semaine.
              </p>
            </div>
            <Link
              href="/extensions/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {(extensions ?? []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#DCEAF5] bg-[#F8FBFD] p-6 text-center">
                <p className="font-black text-[#03357A]">Aucune extension</p>
                <p className="mt-2 text-sm text-slate-500">
                  Ajoutez d’abord les extensions de l’église.
                </p>
              </div>
            ) : (
              (extensions ?? []).map((extension: any) => (
                <article
                  key={extension.id}
                  className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#03357A]">
                        {extension.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {extension.city || extension.address || "Adresse non renseignée"}
                      </p>
                    </div>
                    <ExtensionStatusBadge status={extension.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 text-sm">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">
                        Responsable
                      </p>
                      <p className="mt-1 truncate font-extrabold text-slate-700">
                        {extension.responsible_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">
                        Téléphone
                      </p>
                      <p className="mt-1 truncate font-extrabold text-slate-700">
                        {extension.responsible_phone || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/extensions/activities/new?extension=${extension.id}`}
                      className="rounded-2xl bg-[#03357A] px-4 py-2 text-sm font-extrabold text-white"
                    >
                      Activité
                    </Link>
                    <Link
                      href={`/extensions/${extension.id}/edit`}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-[#03357A]"
                    >
                      Modifier
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[#DCEAF5] md:block">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#F8FBFD] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Extension</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Ville</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCEAF5]">
                {(extensions ?? []).map((extension: any) => (
                  <tr key={extension.id} className="text-slate-700">
                    <td className="px-4 py-4 font-black text-[#03357A]">
                      {extension.name}
                    </td>
                    <td className="px-4 py-4">
                      {extension.responsible_name || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {extension.responsible_phone || "-"}
                    </td>
                    <td className="px-4 py-4">{extension.city || "-"}</td>
                    <td className="px-4 py-4">
                      <ExtensionStatusBadge status={extension.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/extensions/activities/new?extension=${extension.id}`}
                          className="rounded-xl bg-[#EAF3FA] px-3 py-2 text-xs font-black text-[#03357A]"
                        >
                          Activité
                        </Link>
                        <Link
                          href={`/extensions/${extension.id}/edit`}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                        >
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <Link
            href="/extensions/activities"
            className="flex items-start gap-4 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#03357A]">Activités</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Voir toutes les activités déclarées.
              </p>
            </div>
          </Link>

          <Link
            href="/extensions/reports"
            className="flex items-start gap-4 rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-[#03357A]">Synthèse</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Cumul participants, finances et conversions.
              </p>
            </div>
          </Link>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#03357A]">
              <MapPin className="h-5 w-5" />
              <h3 className="font-black">Conseil</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Commencez par créer les 5 extensions, puis demandez à chaque responsable de soumettre son rapport hebdomadaire.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
              <Phone className="h-4 w-4" />
              Responsable extension
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
