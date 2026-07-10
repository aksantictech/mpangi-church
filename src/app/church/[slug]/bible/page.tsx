import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BibleReaderClient from "@/components/public/bible/BibleReaderClient";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicBiblePageProps = { params: Promise<{ slug: string }> };

export default async function PublicBiblePage({ params }: PublicBiblePageProps) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: church } = await admin.from("churches").select("id, name, slug").eq("slug", slug).maybeSingle();
  if (!church) return <main className="min-h-screen bg-[#F5F9FC] p-6"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">Église introuvable.</div></main>;
  const [{ data: versions }, { data: books }, { data: verses }] = await Promise.all([
    admin.from("bible_versions").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    admin.from("bible_books").select("*").order("sort_order", { ascending: true }),
    admin.from("bible_verses").select("*").in("book_code", ["john"]).eq("chapter", 3).order("verse", { ascending: true }),
  ]);
  return <main className="min-h-screen bg-[#F5F9FC] px-4 py-6"><div className="mx-auto max-w-6xl space-y-5"><Link href={`/church/${church.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"><ArrowLeft className="h-4 w-4" />Retour à la page de l’église</Link><BibleReaderClient versions={versions ?? []} books={books ?? []} initialVerses={verses ?? []} /></div></main>;
}
