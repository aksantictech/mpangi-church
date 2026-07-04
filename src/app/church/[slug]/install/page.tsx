import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  MonitorSmartphone,
  Share,
  Smartphone,
} from "lucide-react";
import PwaInstallButton from "@/components/pwa/PwaInstallButton";
import { createClient } from "@/lib/supabase/server";

type ChurchInstallPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getPublicChurchName(church: {
  name: string | null;
  public_name: string | null;
  pwa_name?: string | null;
}) {
  const pwaName = church.pwa_name?.trim();

  if (pwaName) return pwaName;

  const publicName = church.public_name?.trim();

  if (publicName) return publicName;

  const name = church.name?.trim();

  if (!name) return "Église";

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

export async function generateMetadata({
  params,
}: ChurchInstallPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: "Installer l’application",
    manifest: `/church/${slug}/manifest.webmanifest`,
    icons: {
      icon: `/church/${slug}/icon.png`,
      apple: `/church/${slug}/icon.png`,
    },
  };
}

export default async function ChurchInstallPage({
  params,
}: ChurchInstallPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("name, public_name, pwa_name, slug, status, public_enabled")
    .eq("slug", slug)
    .maybeSingle();

  if (!church || church.status !== "active" || !church.public_enabled) {
    notFound();
  }

  const churchName = getPublicChurchName(church);

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-4 py-6 text-[#0F172A]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/church/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la page de l’église
        </Link>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
            <MonitorSmartphone className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Installer {churchName}
          </h1>

          <p className="mt-3 text-sm leading-7 text-blue-50">
            Ajoutez l’application de cette église sur votre téléphone ou votre
            ordinateur. L’application ouvrira directement cette église, sans
            passer par la page globale Mpangi-church.
          </p>

          <div className="mt-6">
            <PwaInstallButton
              label={`Installer ${churchName}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA] sm:w-auto"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Smartphone className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-[#03357A]">
              Android
            </h2>

            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Ouvrir ce lien avec Chrome.</li>
              <li>2. Utiliser le domaine HTTPS de l’église.</li>
              <li>3. Appuyer sur le menu ⋮ du navigateur.</li>
              <li>4. Choisir “Installer l’application”.</li>
            </ol>
          </article>

          <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <Share className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-[#03357A]">
              iPhone
            </h2>

            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. Ouvrir ce lien avec Safari.</li>
              <li>2. Appuyer sur le bouton Partager.</li>
              <li>3. Choisir “Sur l’écran d’accueil”.</li>
              <li>4. Valider l’ajout.</li>
            </ol>
          </article>
        </section>
      </div>
    </main>
  );
}