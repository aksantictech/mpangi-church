import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import BibleReaderClient from "@/components/bible/BibleReaderClient";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  return {
    title: `Lire la Bible | ${slug} | Mpangi-church`,
    description:
      "Lecture biblique française : livres, chapitres, versets et recherche.",
  };
}

export default async function PublicChurchBiblePage({
  params,
}: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: church, error } = await supabase
    .from("churches")
    .select("id, name, public_name, slug, status, public_enabled")
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
    church.public_name?.trim() || church.name?.trim() || "Église";

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto mb-4 max-w-7xl">
        <Link
          href={`/church/${slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à {churchName}
        </Link>
      </div>

      <BibleReaderClient churchSlug={slug} churchName={churchName} />
      <PublicMobileBottomNav slug={slug} />
    </main>
  );
}
