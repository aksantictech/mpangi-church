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
  church={church as any}
  title="Demander un rendez-vous"
  description="Envoyez votre demande de rendez-vous à l’équipe de l’église."
  icon={<CalendarDays className="h-8 w-8" />}
>
      <AppointmentForm churchId={church.id} />
    </PublicFormLayout>
  );
}