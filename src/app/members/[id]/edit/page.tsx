import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberEditForm from "@/components/members/MemberEditForm";
import { createClient } from "@/lib/supabase/server";

type MemberEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemberEditPage({ params }: MemberEditPageProps) {
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
      email,
      gender,
      birth_date,
      address,
      city,
      profession,
      marital_status,
      member_type,
      status
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

        <MemberEditForm member={member} />
      </div>
    </AppShell>
  );
}