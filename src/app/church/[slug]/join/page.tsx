import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import JoinChurchForm from "@/components/public/JoinChurchForm";
import { createClient } from "@/lib/supabase/server";

type JoinPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!church) {
    notFound();
  }

  return (
    <PublicFormLayout
      churchName={church.name}
      churchSlug={church.slug}
      title="Rejoindre l’église"
      description="Laissez vos informations pour être accueilli, contacté et accompagné dans votre intégration."
      icon={<Users className="h-8 w-8" />}
    >
<JoinChurchForm
  churchId={church.id}
  churchName={church.name || "Église"}
/>    </PublicFormLayout>
  );
}