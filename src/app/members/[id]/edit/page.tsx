import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberEditForm from "@/components/members/MemberEditForm";
import { createClient } from "@/lib/supabase/server";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

type MemberEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemberEditPage({ params }: MemberEditPageProps) {
  await requireAnyModulePermission(["members"], "update");
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const { data: memberRaw } = await supabase
    .from("members")
    .select(
      `
      id,
      church_id,
      first_name,
      middle_name,
      last_name,
      phone,
      whatsapp,
      email,
      gender,
      birth_date,
      address,
      city,
      commune,
      quarter,
      profession,
      marital_status,
      integration_year,
      spiritual_status,
      training_notes,
      notes,
      member_type,
      status,
      preferred_name,
      family_name,
      family_role,
      spouse_name,
      children_names,
      anniversary_date,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      conversion_date,
      baptism_date,
      membership_date,
      previous_church,
      discipleship_stage,
      mentor_name,
      training_goal,
      last_training_review_date,
      small_group,
      ministry_interests,
      spiritual_gifts,
      volunteer_availability
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!memberRaw) {
    notFound();
  }

  const member = memberRaw as any;

  if (member.church_id !== profile.church_id) {
    notFound();
  }

  const [{ data: trainingPrograms }, { data: trainingAssignments }] = await Promise.all([
    supabase.from("training_programs").select("id, name").eq("church_id", profile.church_id).eq("status", "active").order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("member_trainings").select("id, training_program_id").eq("church_id", profile.church_id).eq("member_id", member.id).not("training_program_id", "is", null),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/members/${member.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la fiche membre
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <Edit className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Modification membre
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Modifier la fiche membre
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Les modifications concernent uniquement le membre de votre
                église.
              </p>
            </div>
          </div>
        </section>

        <MemberEditForm member={member} trainingPrograms={trainingPrograms ?? []} trainingAssignments={trainingAssignments ?? []} />
      </div>
    </AppShell>
  );
}
