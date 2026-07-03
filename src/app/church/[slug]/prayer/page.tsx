import { notFound } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import PrayerRequestForm from "@/components/public/PrayerRequestForm";
import { createClient } from "@/lib/supabase/server";

type PrayerPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PrayerPage({ params }: PrayerPageProps) {
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
      title="Demander une prière"
      description="Partagez votre sujet de prière avec l’équipe pastorale. Votre demande sera reçue avec respect et confidentialité."
      icon={<HeartHandshake className="h-8 w-8" />}
    >
      <PrayerRequestForm churchId={church.id} />
    </PublicFormLayout>
  );
}