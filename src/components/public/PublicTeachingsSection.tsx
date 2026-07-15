import {
  BookOpenText,
  CalendarDays,
  ExternalLink,
  PlayCircle,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PublicTeachingsSectionProps = {
  churchId: string;
};

function getTypeLabel(
  type?: string | null
) {
  if (type === "news") {
    return "Actualité";
  }

  if (type === "event") {
    return "Événement";
  }

  if (
    type === "announcement"
  ) {
    return "Annonce";
  }

  if (type === "sermon") {
    return "Prédication";
  }

  if (type === "video") {
    return "Vidéo";
  }

  if (type === "message") {
    return "Message";
  }

  return "Enseignement";
}

function getYoutubeEmbedUrl(
  url?: string | null
) {
  if (!url) return null;

  if (
    url.includes(
      "youtube.com/embed/"
    )
  ) {
    return url;
  }

  const watchMatch =
    url.match(/[?&]v=([^&]+)/);

  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch =
    url.match(
      /youtu\.be\/([^?&]+)/
    );

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

function formatDate(
  value?: string | null
) {
  if (!value) return "";

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

export default async function PublicTeachingsSection({
  churchId,
}: PublicTeachingsSectionProps) {
  const supabase =
    await createClient();

  const { data: publications } =
    await supabase
      .from(
        "church_publications"
      )
      .select(
        `
        id,
        title,
        excerpt,
        content,
        category,
        image_url,
        video_url,
        status,
        is_public,
        is_featured,
        published_at
      `
      )
      .eq(
        "church_id",
        churchId
      )
      .eq(
        "status",
        "published"
      )
      .eq("is_public", true)
      .order("is_featured", {
        ascending: false,
      })
      .order("published_at", {
        ascending: false,
      })
      .limit(8);

  const items =
    publications ?? [];

  if (items.length === 0) {
    return null;
  }

  const featured =
    items.find(
      (item: any) =>
        item.is_featured
    ) || items[0];

  const others =
    items.filter(
      (item: any) =>
        item.id !== featured.id
    );

  const featuredEmbed =
    getYoutubeEmbedUrl(
      featured.video_url
    );

  return (
    <section
      id="actualites"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8 md:px-6"
    >
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <BookOpenText className="h-6 w-6" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">
              Vie de l’église
            </p>

            <h2 className="text-2xl font-black text-[#03357A]">
              Actualités,
              événements et
              enseignements
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD]">
            {featured.image_url ? (
              <div className="relative aspect-video overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    featured.image_url
                  }
                  alt={
                    featured.title
                  }
                  className="h-full w-full object-cover"
                />

                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-amber-700 shadow">
                  <Star className="h-3 w-3 fill-current" />
                  En vedette
                </span>
              </div>
            ) : featuredEmbed ? (
              <iframe
                src={featuredEmbed}
                title={
                  featured.title
                }
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#EAF3FA] to-[#DDEAFE]">
                <BookOpenText className="h-16 w-16 text-[#03357A]" />
              </div>
            )}

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                  {getTypeLabel(
                    featured.category
                  )}
                </span>

                {featured.published_at && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(
                      featured.published_at
                    )}
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-xl font-black text-[#03357A]">
                {featured.title}
              </h3>

              {featured.excerpt && (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {
                    featured.excerpt
                  }
                </p>
              )}

              {featured.video_url && (
                <a
                  href={
                    featured.video_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-black text-white hover:bg-[#022B63]"
                >
                  Regarder
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </article>

          <div className="grid gap-3">
            {others.map(
              (
                publication: any
              ) => (
                <article
                  key={
                    publication.id
                  }
                  className="grid min-w-0 grid-cols-[92px_1fr] gap-3 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#EAF3FA]">
                    {publication.image_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            publication.image_url
                          }
                          alt={
                            publication.title
                          }
                          className="h-full w-full object-cover"
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {publication.video_url ? (
                          <PlayCircle className="h-8 w-8 text-[#03357A]" />
                        ) : (
                          <BookOpenText className="h-8 w-8 text-[#03357A]" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 py-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">
                      {getTypeLabel(
                        publication.category
                      )}
                    </p>

                    <h3 className="mt-1 line-clamp-2 break-words font-black text-[#03357A]">
                      {
                        publication.title
                      }
                    </h3>

                    {publication.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {
                          publication.excerpt
                        }
                      </p>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
