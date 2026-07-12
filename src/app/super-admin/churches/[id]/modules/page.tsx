import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import ChurchModulesManager from "@/components/super-admin/modules/ChurchModulesManager";
import { requireSuperAdmin } from "@/lib/security/access";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChurchModulesPage({ params }: PageProps) {
  await requireSuperAdmin();

  const { id } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();

  if (!church) {
    return (
      <SuperAdminShell>
        <div className="rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">
          Église introuvable.
        </div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell>
      <div className="space-y-5">
        <Link
          href="/super-admin/modules"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux églises
        </Link>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
            Église sélectionnée
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#03357A]">
            {church.name}
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            /{church.slug}
          </p>
        </section>

        <ChurchModulesManager churchId={church.id} />
      </div>
    </SuperAdminShell>
  );
}
