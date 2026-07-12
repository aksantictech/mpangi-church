import Link from "next/link";
import { ArrowLeft, CalendarPlus, Save } from "lucide-react";
import { requireChurchModuleAccess } from "@/lib/security/access";
import ExtensionPageHeader from "@/components/extensions/ExtensionPageHeader";
import { getCurrentWeekRange } from "@/lib/extensions/dates";
import { createExtensionActivityAction } from "../../actions";

type NewExtensionActivityPageProps = {
  searchParams?: Promise<{
    extension?: string;
  }>;
};

export default async function NewExtensionActivityPage({
  searchParams,
}: NewExtensionActivityPageProps) {
  const params = await searchParams;
  const selectedExtension = params?.extension || "";
  const { admin, churchId } = await requireChurchModuleAccess("extension_activities");
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const [{ data: extensions }, { data: activityTypes }] = await Promise.all([
    admin
      .from("church_extensions")
      .select("id, name, status")
      .eq("church_id", churchId)
      .eq("status", "active")
      .order("name", { ascending: true }),

    admin
      .from("extension_activity_types")
      .select("name")
      .eq("church_id", churchId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <Link
        href="/extensions/activities"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux activités
      </Link>

      <ExtensionPageHeader
        icon={CalendarPlus}
        title="Activité de la semaine"
        description="Formulaire simple pour remonter les chiffres clés d’une extension."
      />

      <form action={createExtensionActivityAction} className="space-y-5">
        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            1. Extension et période
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Extension *</span>
              <select
                name="extension_id"
                required
                defaultValue={selectedExtension}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="">Sélectionner</option>
                {(extensions ?? []).map((extension: any) => (
                  <option key={extension.id} value={extension.id}>
                    {extension.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Type d’activité *</span>
              <select
                name="activity_type"
                required
                defaultValue="Culte"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                {(activityTypes ?? []).map((type: any) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
                {(activityTypes ?? []).length === 0 && (
                  <option value="Culte">Culte</option>
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Début semaine *</span>
              <input
                type="date"
                name="week_start"
                required
                defaultValue={weekStart}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Fin semaine *</span>
              <input
                type="date"
                name="week_end"
                required
                defaultValue={weekEnd}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Date activité *</span>
              <input
                type="date"
                name="activity_date"
                required
                defaultValue={weekStart}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Statut</span>
              <select
                name="status"
                defaultValue="submitted"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="submitted">Soumis</option>
                <option value="draft">Brouillon</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            2. Participation
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Hommes</span>
              <input
                type="number"
                min={0}
                name="men_count"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Femmes</span>
              <input
                type="number"
                min={0}
                name="women_count"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Enfants</span>
              <input
                type="number"
                min={0}
                name="children_count"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            3. Nouveaux fruits
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Nouveaux convertis</span>
              <input
                type="number"
                min={0}
                name="new_converts_count"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Nouveaux venus</span>
              <input
                type="number"
                min={0}
                name="new_visitors_count"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            4. Recettes et dépenses
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Recettes</span>
              <input
                type="number"
                min={0}
                step="0.01"
                name="income_amount"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Dépenses</span>
              <input
                type="number"
                min={0}
                step="0.01"
                name="expense_amount"
                defaultValue={0}
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Devise</span>
              <select
                name="currency"
                defaultValue="CDF"
                className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] px-4 text-sm font-bold outline-none focus:border-[#03357A]"
              >
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-[#03357A]">
            5. Résumé et besoins
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Résumé</span>
              <textarea
                name="summary"
                rows={5}
                placeholder="Résumé de l’activité, faits marquants, témoignages..."
                className="w-full rounded-2xl border border-[#DCEAF5] px-4 py-3 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">Besoins / difficultés</span>
              <textarea
                name="needs"
                rows={5}
                placeholder="Besoins de prière, soutien, matériel, suivi pastoral..."
                className="w-full rounded-2xl border border-[#DCEAF5] px-4 py-3 text-sm font-bold outline-none focus:border-[#03357A]"
              />
            </label>
          </div>
        </section>

        <div className="sticky bottom-0 z-30 -mx-4 border-t border-[#DCEAF5] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/extensions/activities"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-extrabold text-white"
            >
              <Save className="h-4 w-4" />
              Enregistrer l’activité
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
