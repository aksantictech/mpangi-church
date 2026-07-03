import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Church,
  GraduationCap,
  Pencil,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import TrainingProgramStatusButton from "@/components/settings/TrainingProgramStatusButton";
import { createClient } from "@/lib/supabase/server";

type TrainingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TrainingDetailsPage({
  params,
}: TrainingDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: training } = await supabase
    .from("training_programs")
    .select("id, church_id, name, description, sort_order, status, created_at, churches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!training) {
    notFound();
  }

  const { count: membersCount } = await supabase
    .from("member_trainings")
    .select("*", { count: "exact", head: true })
    .eq("training_program_id", training.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/settings/trainings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux formations
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                <GraduationCap className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  Détail formation
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  {training.name}
                </h1>

                <p className="mt-2 text-sm text-blue-50">
                  {training.churches?.name ?? "Église non renseignée"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/settings/trainings/${training.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>

              <TrainingProgramStatusButton
                trainingId={training.id}
                currentStatus={training.status}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Membres formés"
            value={membersCount ?? 0}
            description="Membres liés à cette formation"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Ordre"
            value={training.sort_order ?? 0}
            description="Position d’affichage"
            icon={GraduationCap}
            accent="purple"
          />

          <MetricCard
            title="Église"
            value={training.churches?.name ?? "-"}
            description="Formation personnalisée"
            icon={Church}
            accent="green"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Informations
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Info label="Nom" value={training.name} />
            <Info label="Statut" value={training.status} />
            <Info label="Ordre d’affichage" value={String(training.sort_order ?? 0)} />
            <Info
              label="Description"
              value={training.description || "Aucune description."}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-semibold text-slate-700">{value}</p>
    </div>
  );
}