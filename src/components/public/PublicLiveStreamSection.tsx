import Link from "next/link";
import {
  BellRing,
  ExternalLink,
  Radio,
  Video,
} from "lucide-react";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";

type PublicLiveStreamSectionProps = {
  church: {
    id: string;
    slug?: string | null;
    live_stream_enabled?: boolean | null;
    live_stream_url?: string | null;
    live_stream_title?: string | null;
    live_stream_description?: string | null;
    live_stream_platform?: string | null;
  };
};


export default function PublicLiveStreamSection({
  church,
}: PublicLiveStreamSectionProps) {
  const hasLive =
    Boolean(
      church.live_stream_enabled
    ) &&
    Boolean(
      church.live_stream_url?.trim()
    );

  const internalLiveHref =
    church.slug
      ? `/church/${church.slug}/live`
      : "/live";

  return (
    <section
      id="live"
      className="scroll-mt-24 mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-8"
    >
      <div
        className={[
          "rounded-[2rem] border p-5 shadow-lg backdrop-blur md:p-6",
          hasLive
            ? "border-red-200 bg-gradient-to-br from-red-700 via-red-600 to-[#7F1D1D] text-white shadow-red-950/25"
            : "border-[#DCEAF5] bg-white text-[#0F172A] shadow-blue-950/5",
        ].join(" ")}
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div
              className={[
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                hasLive
                  ? "bg-white/15 text-white"
                  : "bg-[#EAF3FA] text-[#03357A]",
              ].join(" ")}
            >
              {hasLive ? (
                <Radio className="h-7 w-7 animate-pulse" />
              ) : (
                <BellRing className="h-7 w-7" />
              )}
            </div>

            <div>
              {hasLive && (
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  En direct maintenant
                </span>
              )}

              <p
                className={[
                  "text-sm font-bold uppercase tracking-[0.2em]",
                  hasLive
                    ? "text-red-100"
                    : "text-[#2563EB]",
                ].join(" ")}
              >
                {hasLive
                  ? "Culte en direct"
                  : "Alertes de direct"}
              </p>

              <h2
                className={[
                  "mt-1 text-2xl font-black",
                  hasLive
                    ? "text-white"
                    : "text-[#03357A]",
                ].join(" ")}
              >
                {hasLive
                  ? church.live_stream_title ||
                    "Suivez le culte en direct"
                  : "Soyez informé du prochain culte"}
              </h2>

              <p
                className={[
                  "mt-2 max-w-2xl text-sm leading-7",
                  hasLive
                    ? "text-red-50"
                    : "text-slate-500",
                ].join(" ")}
              >
                {hasLive
                  ? church.live_stream_description ||
                    "Le direct est disponible dans l’application."
                  : "Activez les notifications pour recevoir les annonces de cultes, événements et publications."}
              </p>

              {church.live_stream_platform &&
                hasLive && (
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-red-100">
                    Plateforme :{" "}
                    {church.live_stream_platform}
                  </p>
                )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasLive && (
              <>
                <Link
                  href={internalLiveHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-red-700 shadow-sm hover:bg-red-50"
                >
                  <Video className="h-4 w-4" />
                  Regarder dans l’application
                </Link>

                <a
                  href={
                    church.live_stream_url ||
                    "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 hover:bg-white/20"
                >
                  Ouvrir la plateforme
                  <ExternalLink className="h-4 w-4" />
                </a>
              </>
            )}

            <NotificationSubscribeButton
              churchId={church.id}
              label="Activer les notifications"
              className={
                hasLive
                  ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-70"
                  : "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#022B63] disabled:opacity-70"
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
