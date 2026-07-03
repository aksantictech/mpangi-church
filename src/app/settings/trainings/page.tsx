import Link from "next/link";
import { notFound } from "next/navigation";
import TrainingProgramStatusButton from "@/components/settings/TrainingProgramStatusButton";
import {
  ArrowLeft,
  Church,
  GraduationCap,
  Layers3,
  PlusCircle,
  Eye,
Pencil,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import TrainingProgramForm from "@/components/settings/TrainingProgramForm";
import { createClient } from "@/lib/supabase/server";

export default async function TrainingSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, church_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isSuperAdmin = profile.role === "super_admin";

  const { data: churches } = await supabase
    .from("churches")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  let trainingsQuery = supabase
    .from("training_programs")
    .select("id, church_id, name, description, sort_order, status, created_at, churches(name)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!isSuperAdmin && profile.church_id) {
    trainingsQuery = trainingsQuery.eq("church_id", profile.church_id);
  }

  const { data: trainingPrograms, error } = await trainingsQuery;

  const activeTrainings =
    trainingPrograms?.filter((training) => training.status === "active")
      .length ?? 0;

  const churchCount = new Set(
    trainingPrograms
      ?.map((training) => training.church_id)
      .filter(Boolean) as string[]
  ).size;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paramètres
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                <GraduationCap className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  Paramètres
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  Formations de l’église
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                  Configurez les formations suivies par les membres. Chaque
                  église peut avoir son propre parcours.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Formations actives"
            value={activeTrainings}
            description="Disponibles dans les fiches membres"
            icon={GraduationCap}
            accent="blue"
          />

          <MetricCard
            title="Églises concernées"
            value={churchCount}
            description="Avec formations configurées"
            icon={Church}
            accent="purple"
          />

          <MetricCard
            title="Mode"
            value="Personnalisé"
            description="Chaque église configure son parcours"
            icon={Layers3}
            accent="green"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <PlusCircle className="h-6 w-6 text-[#03357A]" />
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Ajouter une formation
              </h2>
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Créez une formation qui apparaîtra ensuite dans le formulaire
              d’ajout de membre.
            </p>

            <div className="mt-6">
              <TrainingProgramForm
                profile={profile}
                churches={churches ?? []}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-[#03357A]">
                  Formations configurées
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Liste des formations disponibles pour les membres.
                </p>
              </div>

              <span className="rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A]">
                {trainingPrograms?.length ?? 0} formation(s)
              </span>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCEAF5]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EAF3FA] text-[#03357A]">
<tr>
  <th className="px-4 py-3">Formation</th>
  <th className="px-4 py-3">Église</th>
  <th className="px-4 py-3">Ordre</th>
  <th className="px-4 py-3">Statut</th>
  <th className="px-4 py-3 text-right">Actions</th>
</tr>
                </thead>

                <tbody className="divide-y divide-[#DCEAF5] bg-white">
                  {error && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-red-600">
                        Erreur : {error.message}
                      </td>
                    </tr>
                  )}

                  {!error && trainingPrograms?.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <GraduationCap className="mx-auto h-10 w-10 text-[#3F79B3]" />
                        <p className="mt-3 font-medium">
                          Aucune formation configurée pour le moment.
                        </p>
                      </td>
                    </tr>
                  )}

                  {trainingPrograms?.map((training: any) => (
                    <tr key={training.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">
                          {training.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {training.description || "Aucune description."}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {training.churches?.name ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {training.sort_order}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                          {training.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
  <div className="flex flex-wrap justify-end gap-2">
    <Link
      href={`/settings/trainings/${training.id}`}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
    >
      <Eye className="h-4 w-4" />
      Voir
    </Link>

    <Link
      href={`/settings/trainings/${training.id}/edit`}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#F1E8FF] px-4 py-2 text-sm font-bold text-[#8B5CF6] hover:bg-purple-100"
    >
      <Pencil className="h-4 w-4" />
      Modifier
    </Link>

    <TrainingProgramStatusButton
      trainingId={training.id}
      currentStatus={training.status}
    />
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}