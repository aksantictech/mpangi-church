import { notFound } from "next/navigation";
import { UserPlus } from "lucide-react";
import MemberAccountRequestForm from "@/components/public/MemberAccountRequestForm";
import PublicFormLayout from "@/components/public/PublicFormLayout";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AccountRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: church } = await createAdminClient()
    .from("churches")
    .select("id, name, public_name, slug, status, public_enabled, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!church || church.status !== "active" || !church.public_enabled) notFound();

  return (
    <PublicFormLayout
      church={church as any}
      title="Demander mon compte membre"
      description="Votre fiche membre doit déjà exister. Saisissez votre numéro de membre ou scannez le QR de votre carte ; l’administrateur de l’église vérifiera ensuite la demande."
      icon={<UserPlus className="h-8 w-8" />}
    >
      <MemberAccountRequestForm churchSlug={slug} />
    </PublicFormLayout>
  );
}

