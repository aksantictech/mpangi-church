import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import AppointmentForm from "@/components/public/AppointmentForm";
import { createClient } from "@/lib/supabase/server";

type AppointmentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AppointmentPage({ params }: AppointmentPageProps) {
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
      title="Prendre rendez-vous"
      description="Envoyez une demande de rendez-vous avec un pasteur ou un responsable de l’église."
      icon={<CalendarDays className="h-8 w-8" />}
    >
      <AppointmentForm churchId={church.id} />
    </PublicFormLayout>
  );
}