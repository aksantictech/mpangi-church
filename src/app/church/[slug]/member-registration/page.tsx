import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import PublicMemberRegistrationForm from "@/components/public/PublicMemberRegistrationForm";
import { createAdminClient } from "@/lib/supabase/admin";

type MemberRegistrationPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function MemberRegistrationPage({
  params,
  searchParams,
}: MemberRegistrationPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      status,
      public_enabled,
      member_form_enabled,
      member_form_token
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    !church ||
    church.status !== "active" ||
    !church.public_enabled ||
    !church.member_form_enabled ||
    church.member_form_token !== token
  ) {
    notFound();
  }

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("church_id", church.id)
    .order("name", { ascending: true });

  const { data: trainingPrograms } = await supabase
    .from("training_programs")
    .select("id, name")
    .eq("church_id", church.id)
    .order("sort_order", { ascending: true });

  return (
    <PublicFormLayout
      church={church as any}
      title="Ajouter ma fiche membre"
      description="Ce formulaire permet aux serviteurs et membres de transmettre eux-mêmes leurs informations complètes à l’église."
      icon={<Users className="h-8 w-8" />}
    >
      <PublicMemberRegistrationForm
        churchSlug={slug}
        token={token}
        departments={(departments ?? []) as any}
        trainingPrograms={(trainingPrograms ?? []) as any}
      />
    </PublicFormLayout>
  );
}