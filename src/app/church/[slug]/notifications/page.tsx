import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";
import { createClient } from "@/lib/supabase/server";
import { buildChurchPublicUrl } from "@/lib/tenant/domain";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps) {
  const { slug } = await params;

  return {
    title: `Notifications | ${slug} | Mpangi-church`,
    description:
      "Activez les notifications de votre église sur cet appareil.",
  };
}

export default async function PublicNotificationsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase =
    await createClient();

  const { data: church, error } =
    await supabase
      .from("churches")
      .select(
        "id, name, public_name, slug, status, public_enabled"
      )
      .eq("slug", slug)
      .maybeSingle();

  if (
    error ||
    !church ||
    church.status !== "active" ||
    !church.public_enabled
  ) {
    notFound();
  }

  const churchName =
    church.public_name?.trim() ||
    church.name?.trim() ||
    "Église";

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={buildChurchPublicUrl(
            church
          )}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à {churchName}
        </Link>

        <section className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-7">
          <BellRing className="h-9 w-9" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Restez informé
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Notifications de {churchName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
            Recevez les actualités, événements, enseignements
            et communications importantes directement sur cet
            appareil.
          </p>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm sm:p-6">
          <NotificationSubscribeButton
            churchId={church.id}
            label="Activer les notifications"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#022B63]"
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={CheckCircle2}
              title="Activation volontaire"
              text="Le navigateur vous demandera votre autorisation avant l’abonnement."
            />

            <InfoCard
              icon={ShieldCheck}
              title="Données limitées"
              text="L’abonnement contient uniquement les informations techniques nécessaires au Push."
            />
          </div>

          <div className="mt-5 rounded-2xl bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
            Si l’autorisation a déjà été refusée, ouvrez les
            paramètres du site dans votre navigateur et réactivez
            les notifications pour ce domaine.
          </div>
        </section>
      </div>

      <PublicMobileBottomNav
        slug={slug}
      />
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CheckCircle2;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <Icon className="h-5 w-5 text-[#03357A]" />

      <h2 className="mt-3 font-black text-[#03357A]">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {text}
      </p>
    </article>
  );
}
