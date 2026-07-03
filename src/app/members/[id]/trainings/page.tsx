import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberTrainingsManager from "@/components/members/MemberTrainingsManager";
import { createClient } from "@/lib/supabase/server";

type MemberTrainingsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

export default async function MemberTrainingsPage({
  params,
}: MemberTrainingsPageProps) {
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
      last_name
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

  const [{ data: trainings }, { data: assignments }] = await Promise.all([
    supabase
      .from("trainings")
      .select("id, title, status")
      .eq("church_id", profile.church_id)
      .eq("status", "active")
      .order("title", { ascending: true }),

    supabase
      .from("member_trainings")
      .select(
        `
        id,
        church_id,
        member_id,
        training_id,
        status,
        started_at,
        completed_at,
        notes,
        trainings(id, title)
      `
      )
      .eq("church_id", profile.church_id)
      .eq("member_id", member.id)
      .order("created_at", { ascending: false }),
  ]);

  const memberName = getMemberName(member) || "Nom non renseigné";

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
              <BookOpenCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Formations du membre
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">{memberName}</h1>

              <p className="mt-2 text-sm text-blue-50">
                Gérez le parcours de formation de ce membre.
              </p>
            </div>
          </div>
        </section>

        <MemberTrainingsManager
          memberId={member.id}
          churchId={member.church_id}
          profileId={profile.id}
          trainings={(trainings ?? []) as any}
          assignments={(assignments ?? []) as any}
        />
      </div>
    </AppShell>
  );
}