import { BellRing, ExternalLink, Radio, Video } from "lucide-react";
import NotificationSubscribeButton from "@/components/public/NotificationSubscribeButton";

type PublicLiveStreamSectionProps = {
  church: {
    id: string;
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
    church.live_stream_enabled && church.live_stream_url?.trim();

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="rounded-[2rem] border border-white/20 bg-white/10 p-5 text-white shadow-lg shadow-blue-950/10 backdrop-blur md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              {hasLive ? (
                <Radio className="h-7 w-7" />
              ) : (
                <BellRing className="h-7 w-7" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
                {hasLive ? "Culte en direct" : "Notifications"}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {hasLive
                  ? church.live_stream_title || "Suivez le culte en direct"
                  : "Recevez les alertes de l’église"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                {hasLive
                  ? church.live_stream_description ||
                    "Le direct est disponible. Cliquez pour suivre le culte maintenant."
                  : "Activez les notifications pour recevoir les annonces importantes, les cultes en direct et les publications de l’église."}
              </p>

              {church.live_stream_platform && hasLive && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-100">
                  Plateforme : {church.live_stream_platform}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasLive && (
              <a
                href={church.live_stream_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                <Video className="h-4 w-4" />
                Regarder le direct
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <NotificationSubscribeButton
              churchId={church.id}
              label="Activer les notifications"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 hover:bg-white/20 disabled:opacity-70"
            />
          </div>
        </div>
      </div>
    </section>
  );
}