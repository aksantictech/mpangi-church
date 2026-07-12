import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import PageHeader from "@/components/common/PageHeader";
import { requireSuperAdmin } from "@/lib/security/access";
import { getOnboardingSummaries } from "@/lib/onboarding/onboarding";
import OnboardingDashboardClient from "@/components/super-admin/onboarding/OnboardingDashboardClient";

export default async function SuperAdminOnboardingPage() {
  await requireSuperAdmin();

  const churches = await getOnboardingSummaries();

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <Link
          href="/super-admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour dashboard
        </Link>

        <PageHeader
          eyebrow="Onboarding"
          title="Onboarding contrôlé des églises"
          description="Suivez la mise en service des églises pilotes : identité, logo, domaine, modules, utilisateurs, PWA et validation finale."
          icon={Building2}
          action={
            <Link
              href="/super-admin/churches/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A]"
            >
              <CheckCircle2 className="h-4 w-4" />
              Nouvelle église
            </Link>
          }
        />

        <OnboardingDashboardClient initialChurches={churches} />
      </div>
    </SuperAdminShell>
  );
}
