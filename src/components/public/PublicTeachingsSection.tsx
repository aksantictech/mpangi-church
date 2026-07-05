import { BookOpenText, ExternalLink, PlayCircle, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PublicTeachingsSectionProps = {
  churchId: string;
};

export default async function PublicTeachingsSection({
  churchId,
}: PublicTeachingsSectionProps) {
  const supabase = await createClient();

  const { data: publications } = await supabase
    .from("church_publications")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_published", true)
    .in("publication_type", ["teaching", "video", "sermon", "message"])
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(6);

  const items = publications ?? [];

  if (items.length === 0) {
    return null;
  }

  const featured = items.find((item: any) => item.is_featured) || items[0];
  const others = items.filter((item: any) => item.id !== featured.id);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
              <BookOpenText className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                Enseignements
              </p>

              <h2 className="text-2xl font-black text-[#03357A]">
                Vidéos, messages et prédications
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD]">
            {featured.video_embed_url ? (
              <iframe
                src={featured.video_embed_url}
                title={featured.title}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-[#EAF3FA]">
                <PlayCircle className="h-16 w-16 text-[#03357A]" />
              </div>
            )}

            <div className="p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-extrabold text-yellow-700">
                  <Star className="h-3 w-3" />
                  En vedette
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#03357A]">
                {featured.title}
              </h3>

              {featured.description && (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {featured.description}
                </p>
              )}

              {featured.video_url && (
                <a
                  href={featured.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
                >
                  Regarder
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </article>

          <div className="grid gap-3">
            {others.map((publication: any) => (
              <article
                key={publication.id}
                className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                  {publication.publication_type === "sermon"
                    ? "Prédication"
                    : publication.publication_type === "video"
                      ? "Vidéo"
                      : publication.publication_type === "message"
                        ? "Message"
                        : "Enseignement"}
                </p>

                <h3 className="mt-2 font-extrabold text-[#03357A]">
                  {publication.title}
                </h3>

                {publication.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {publication.description}
                  </p>
                )}

                {publication.video_url && (
                  <a
                    href={publication.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#2563EB]"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Regarder
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}