import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import PageHeader from "@/components/common/PageHeader";
import { requireSuperAdmin } from "@/lib/security/access";
import { getChurchOnboarding } from "@/lib/onboarding/onboarding";
import ChurchOnboardingClient from "@/components/super-admin/onboarding/ChurchOnboardingClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChurchOnboardingPage({ params }: PageProps) {
  await requireSuperAdmin();

  const { id } = await params;
  const payload = await getChurchOnboarding(id);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <Link
          href="/super-admin/onboarding"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour onboarding
        </Link>

        <PageHeader
          eyebrow="Onboarding église"
          title={payload.church.name}
          description={`Suivi de mise en service pour /${payload.church.slug}.`}
          icon={Building2}
          action={
            <Link
              href={`/super-admin/churches/${payload.church.id}/modules`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]"
            >
              Gérer les modules
            </Link>
          }
        />

        <ChurchOnboardingClient initialPayload={payload} />
      </div>
    </SuperAdminShell>
  );
}
