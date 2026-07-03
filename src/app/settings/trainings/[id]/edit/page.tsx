import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TrainingProgramEditForm from "@/components/settings/TrainingProgramEditForm";
import { createClient } from "@/lib/supabase/server";

type EditTrainingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTrainingPage({
  params,
}: EditTrainingPageProps) {
  const { id } = await params;

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

  const { data: training } = await supabase
    .from("training_programs")
    .select("id, church_id, name, description, sort_order, status")
    .eq("id", id)
    .maybeSingle();

  if (!training) {
    notFound();
  }

  const { data: churches } = await supabase
    .from("churches")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/settings/trainings/${training.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au détail
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <GraduationCap className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Modifier formation
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                {training.name}
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                Modifiez le nom, la description, l’ordre ou le statut de cette formation.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
          <TrainingProgramEditForm
            profile={profile}
            churches={churches ?? []}
            training={training}
          />
        </section>
      </div>
    </AppShell>
  );
}