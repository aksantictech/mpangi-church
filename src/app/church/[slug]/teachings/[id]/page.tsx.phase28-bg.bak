import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotificationPermissionCard from "@/components/notifications/NotificationPermissionCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type PublicTeachingDetailPageProps = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

export default async function PublicTeachingDetailPage({
  params,
}: PublicTeachingDetailPageProps) {
  const { slug, id } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!church) {
    return (
      <main className="min-h-screen bg-[#F5F9FC] p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">
          Église introuvable.
        </div>
      </main>
    );
  }

  const { data: teaching } = await admin
    .from("church_teachings")
    .select("*")
    .eq("church_id", church.id)
    .eq("status", "published")
    .eq("id", id)
    .maybeSingle();

  if (!teaching) {
    return (
      <main className="min-h-screen bg-[#F5F9FC] p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">
          Enseignement introuvable.
        </div>
      </main>
    );
  }

  const { data: related } = await admin
    .from("church_teachings")
    .select("id, title, thumbnail_url")
    .eq("church_id", church.id)
    .eq("status", "published")
    .neq("id", teaching.id)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href={`/church/${church.slug}/teachings`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Tous les enseignements
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-sm">
          <div className="aspect-video bg-black">
            <iframe
              src={getYouTubeEmbedUrl(teaching.youtube_video_id)}
              title={teaching.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="p-6">
            <p className="text-xs font-black uppercase tracking-wide text-[#8B5CF6]">
              {church.name} · {teaching.category || "Enseignement"}
            </p>
            <h1 className="mt-3 text-3xl font-black text-[#03357A]">
              {teaching.title}
            </h1>

            {teaching.teacher_name && (
              <p className="mt-2 text-sm font-bold text-slate-500">
                {teaching.teacher_name}
              </p>
            )}

            {teaching.description && (
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                {teaching.description}
              </p>
            )}
          </div>
        </section>

        <NotificationPermissionCard churchSlug={church.slug} />

        {(related ?? []).length > 0 && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#03357A]">
              Autres enseignements
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(related ?? []).map((item: any) => (
                <Link
                  key={item.id}
                  href={`/church/${church.slug}/teachings/${item.id}`}
                  className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-3 font-bold text-[#03357A]"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
