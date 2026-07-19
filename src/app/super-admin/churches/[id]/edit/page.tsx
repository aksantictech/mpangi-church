import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Church } from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import SuperAdminChurchForm from "@/components/super-admin/SuperAdminChurchForm";
import { createClient } from "@/lib/supabase/server";

type EditSuperAdminChurchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSuperAdminChurchPage({
  params,
}: EditSuperAdminChurchPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      slug,
      status,
      logo_url,
      pastor_photo_url,
      pastor_name,
      pastor_title,
      address,
      city,
      country,
      phone,
      whatsapp,
      email,
      public_hero_title,
      public_message,
      service_times,
      public_enabled,
      login_enabled,
      youtube_channel_url,
      latest_video_url,
      news_title,
      news_description
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!church) {
    notFound();
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <Link
          href={`/super-admin/churches/${church.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’église
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <Church className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Super Admin
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Modifier l’église
              </h1>

              <p className="mt-2 text-sm leading-7 text-blue-50">
                Modifiez les informations publiques, les contacts, le logo et la
                photo du pasteur.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#DCEAF5] bg-white p-5 shadow-sm md:p-6">
          <SuperAdminChurchForm initialChurch={church} />
        </section>
      </div>
    </SuperAdminShell>
  );
}
