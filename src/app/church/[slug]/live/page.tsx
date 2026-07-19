import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Radio,
  Video,
} from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";
import { createClient } from "@/lib/supabase/server";

type LivePageProps = {
  params: Promise<{
    slug: string;
  }>;
};


export const dynamic =
  "force-dynamic";

export const revalidate = 0;

function getEmbedUrl(
  rawUrl: string | null
) {
  const url =
    rawUrl?.trim();

  if (!url) return null;

  if (
    url.includes(
      "youtube.com/embed/"
    )
  ) {
    return url;
  }

  const watchMatch =
    url.match(
      /[?&]v=([^&]+)/
    );

  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }

  const shortMatch =
    url.match(
      /youtu\.be\/([^?&/]+)/
    );

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }

  if (
    url.includes(
      "facebook.com"
    )
  ) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      url
    )}&show_text=false&autoplay=true`;
  }

  return null;
}

function isTenantHost(
  hostname: string
) {
  const rootDomain =
    process.env
      .NEXT_PUBLIC_ROOT_DOMAIN ||
    "mpangi-church.app";

  const normalized =
    hostname
      .split(":")[0]
      .toLowerCase();

  return (
    normalized.endsWith(
      `.${rootDomain}`
    ) &&
    normalized !==
      `www.${rootDomain}`
  );
}

export default async function PublicLivePage({
  params,
}: LivePageProps) {
  const { slug } =
    await params;

  const requestHeaders =
    await headers();

  const technicalHome =
    `/church/${slug}`;

  const homeHref =
    isTenantHost(
      requestHeaders.get("host") ||
        ""
    )
      ? "/"
      : technicalHome;

  const supabase =
    await createClient();

  const {
    data: church,
    error,
  } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      status,
      public_enabled,
      live_stream_enabled,
      live_stream_url,
      live_stream_title,
      live_stream_description,
      live_stream_platform
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    error ||
    !church ||
    church.status !==
      "active" ||
    !church.public_enabled
  ) {
    notFound();
  }

  const churchName =
    church.public_name?.trim() ||
    church.name?.trim() ||
    "Église";

  const hasLive =
    Boolean(
      church.live_stream_enabled
    ) &&
    Boolean(
      church.live_stream_url?.trim()
    );

  const embedUrl =
    getEmbedUrl(
      church.live_stream_url
    );

  return (
    <main className="min-h-screen bg-[#0B1220] pb-24 text-white lg:pb-8">
      <header className="border-b border-white/10 bg-gradient-to-br from-red-800 via-red-700 to-[#7F1D1D] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-6xl">
          <Link
            href={homeHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’accueil
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Radio className="h-7 w-7 animate-pulse" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">
                Espace direct
              </p>

              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                {church.live_stream_title ||
                  `Culte en direct — ${churchName}`}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-red-50">
                {church.live_stream_description ||
                  "Suivez le culte directement dans l’application Mpangi-Church."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        {hasLive ? (
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-red-950/25">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={
                  church.live_stream_title ||
                  "Culte en direct"
                }
                className="aspect-video w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center p-6 text-center">
                <Video className="h-14 w-14 text-red-400" />

                <h2 className="mt-4 text-xl font-black">
                  La plateforme ne permet pas la lecture intégrée
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">
                  Ouvrez le direct sur la plateforme configurée par l’église.
                </p>

                <a
                  href={
                    church.live_stream_url ||
                    "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
                >
                  Ouvrir le direct
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
            <Radio className="mx-auto h-14 w-14 text-red-400" />

            <h2 className="mt-4 text-2xl font-black">
              Aucun direct en cours
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Activez les notifications pour être informé dès que le prochain culte commence.
            </p>

            <div className="mt-5 flex justify-center">
              <NotificationSubscribeButton
                churchId={church.id}
              />
            </div>
          </div>
        )}

        {church.live_stream_platform && (
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Plateforme :{" "}
            {church.live_stream_platform}
          </p>
        )}
      </section>

      <PublicMobileBottomNav
  slug={slug}
  hasLive={hasLive}
/>
    </main>
  );
}
