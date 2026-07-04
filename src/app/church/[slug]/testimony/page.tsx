import { notFound } from "next/navigation";
import { Quote } from "lucide-react";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import TestimonyForm from "@/components/public/TestimonyForm";
import { createClient } from "@/lib/supabase/server";

type TestimonyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TestimonyPage({ params }: TestimonyPageProps) {
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
  church={church as any}
      title="Envoyer un témoignage"
      description="Partagez ce que Dieu a fait dans votre vie. Votre témoignage sera reçu par l’équipe de l’église."
      icon={<Quote className="h-8 w-8" />}
    >
      <TestimonyForm churchId={church.id} />
    </PublicFormLayout>
  );
}