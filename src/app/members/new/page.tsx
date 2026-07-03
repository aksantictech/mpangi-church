import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberForm from "@/components/members/MemberForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewMemberPage() {
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

  const { data: churches } = await supabase
    .from("churches")
    .select("id, name")
    .eq("status", "actif")
    .order("name", { ascending: true });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, church_id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  const { data: trainingPrograms } = await supabase
    .from("training_programs")
    .select("id, church_id, name")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux membres
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <UserPlus className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Gestion des membres
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Ajouter un membre
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                Enregistrez un membre, son département de service, sa photo,
                son année d’intégration et ses formations suivies.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-4 shadow-sm md:p-6">
          <MemberForm
            profile={profile}
            churches={churches ?? []}
            departments={departments ?? []}
            trainingPrograms={trainingPrograms ?? []}
          />
        </section>
      </div>
    </AppShell>
  );
}