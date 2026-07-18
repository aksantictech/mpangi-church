import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type {
  CSSProperties,
} from "react";
import type { Metadata } from "next";
import type {
  LucideIcon,
} from "lucide-react";
import {
  CalendarDays,
  HeartHandshake,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";

import ChurchTeachingsBlock from "@/components/public/ChurchTeachingsBlock";
import PublicBibleBlock from "@/components/public/bible/PublicBibleBlock";
import PublicDonationSection from "@/components/public/PublicDonationSection";
import PublicFeaturedUpdates from "@/components/public/PublicFeaturedUpdates";
import PublicLiveStreamSection from "@/components/public/PublicLiveStreamSection";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";
import PublicTestimoniesSection from "@/components/public/PublicTestimoniesSection";
import { createClient } from "@/lib/supabase/server";
import { buildChurchPublicUrl } from "@/lib/tenant/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicChurchPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type PublicChurchNameInput = {
  name?: string | null;
  public_name?: string | null;
};

type PublicChurch = {
  id: string;
  name: string | null;
  public_name: string | null;
  slug: string | null;
  subdomain: string | null;
  status: string | null;

  logo_url: string | null;
  cover_image_url: string | null;
  pastor_photo_url: string | null;
  pastor_name: string | null;
  pastor_title: string | null;

  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;

  public_hero_title: string | null;
  public_message: string | null;
  public_slogan: string | null;
  service_times: string | null;
  public_enabled: boolean | null;
  login_enabled: boolean | null;

  theme_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  surface_color: string | null;
  text_color: string | null;

  public_layout: string | null;
  public_hero_style: string | null;

  show_pastor: boolean | null;
  show_programs: boolean | null;
  show_publications: boolean | null;
  show_teachings: boolean | null;
  show_donations: boolean | null;

  youtube_channel_url: string | null;
  latest_video_url: string | null;
  news_title: string | null;
  news_description: string | null;

  donation_enabled: boolean | null;
  donation_message: string | null;
  donation_mobile_money: string | null;
  donation_mobile_money_name: string | null;
  donation_card_url: string | null;
  donation_bank_name: string | null;
  donation_bank_account_name: string | null;
  donation_bank_account_number: string | null;
  donation_bank_iban: string | null;
  donation_bank_swift: string | null;
  donation_bank_details: string | null;

  live_stream_enabled: boolean | null;
  live_stream_url: string | null;
  live_stream_title: string | null;
  live_stream_description: string | null;
  live_stream_platform: string | null;
  live_stream_started_at: string | null;
  live_stream_notified_at: string | null;
};

function getPublicChurchName(
  church: PublicChurchNameInput
) {
  const publicName =
    church.public_name?.trim();

  if (publicName) {
    return publicName;
  }

  const name = church.name?.trim();

  if (!name) {
    return "Église";
  }

  return name
    .replace(
      /\s*[,|-]?\s*extension.*$/i,
      ""
    )
    .trim();
}

function formatPhoneForWhatsapp(
  phone: string | null
) {
  if (!phone) return null;

  const cleaned = phone.replace(
    /[^\d]/g,
    ""
  );

  if (!cleaned) return null;

  return `https://wa.me/${cleaned}`;
}

function getYoutubeEmbedUrl(
  url: string | null
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
    url.match(/youtu\.be\/([^?&]+)/);

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

function safeColor(
  value: string | null,
  fallback: string
) {
  const color = String(
    value || ""
  ).trim();

  return /^#[0-9A-Fa-f]{6}$/.test(
    color
  )
    ? color.toUpperCase()
    : fallback;
}

function safeBackgroundImage(
  value: string | null
) {
  return String(value || "")
    .trim()
    .replace(/["\\\n\r]/g, "");
}

export async function generateMetadata({
  params,
}: PublicChurchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase =
    await createClient();

  const { data: church } =
    await supabase
      .from("churches")
      .select(
        `
        name,
        public_name,
        public_message,
        public_slogan,
        logo_url
      `
      )
      .eq("slug", slug)
      .maybeSingle();

  if (!church) {
    return {
      title:
        "Église | Mpangi-church",
      manifest:
        `/church/${slug}/manifest.webmanifest`,
    };
  }

  const churchPublicName =
    getPublicChurchName(church);

  return {
    title:
      `${churchPublicName} | Mpangi-church`,
    description:
      church.public_slogan ||
      church.public_message ||
      `Page officielle de ${churchPublicName} sur Mpangi-church.`,
    manifest:
      `/church/${slug}/manifest.webmanifest`,
    icons: {
      icon:
        `/church/${slug}/icon.png`,
      apple:
        `/church/${slug}/icon.png`,
    },
  };
}

export default async function PublicChurchPage({
  params,
}: PublicChurchPageProps) {
  const { slug } = await params;
  const supabase =
    await createClient();

  const {
    data: churchRaw,
    error,
  } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      subdomain,
      status,
      logo_url,
      cover_image_url,
      pastor_photo_url,
      pastor_name,
      pastor_title,
      address,
      city,
      country,
      phone,
      whatsapp,
      email,
      public_hero_title,
      public_message,
      public_slogan,
      service_times,
      public_enabled,
      login_enabled,
      theme_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      public_layout,
      public_hero_style,
      show_pastor,
      show_programs,
      show_publications,
      show_teachings,
      show_donations,
      youtube_channel_url,
      latest_video_url,
      news_title,
      news_description,
      donation_enabled,
      donation_message,
      donation_mobile_money,
      donation_mobile_money_name,
      donation_card_url,
      donation_bank_name,
      donation_bank_account_name,
      donation_bank_account_number,
      donation_bank_iban,
      donation_bank_swift,
      donation_bank_details,
      live_stream_enabled,
      live_stream_url,
      live_stream_title,
      live_stream_description,
      live_stream_platform,
      live_stream_started_at,
      live_stream_notified_at
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    error ||
    !churchRaw ||
    churchRaw.status !== "active" ||
    !churchRaw.public_enabled
  ) {
    notFound();
  }

  const church =
    churchRaw as PublicChurch;

  const churchSlug =
    church.slug?.trim() || slug;

  const churchPublicName =
    getPublicChurchName(church);

  const whatsappUrl =
    formatPhoneForWhatsapp(
      church.whatsapp ||
        church.phone
    );

  const logoSrc =
    church.logo_url ||
    "/images/churches/maison-misericorde-logo.png";

  const pastorPhotoSrc =
    church.pastor_photo_url ||
    "/images/churches/maison-misericorde-pasteur.png";

  const youtubeEmbedUrl =
    getYoutubeEmbedUrl(
      church.latest_video_url
    );

  const welcomeTitle =
    church.public_hero_title?.trim() ||
    `Bienvenue à ${churchPublicName}`;

  const themeColor = safeColor(
    church.theme_color,
    "#03357A"
  );

  const secondaryColor = safeColor(
    church.secondary_color,
    "#2563EB"
  );

  const accentColor = safeColor(
    church.accent_color,
    "#8B5CF6"
  );

  const backgroundColor = safeColor(
    church.background_color,
    "#F5F9FC"
  );

  const surfaceColor = safeColor(
    church.surface_color,
    "#FFFFFF"
  );

  const textColor = safeColor(
    church.text_color,
    "#0F172A"
  );

  const publicLayout =
    church.public_layout ||
    "modern";

  const heroStyle =
    church.public_hero_style ||
    "gradient";

  const coverImage =
    safeBackgroundImage(
      church.cover_image_url
    );

  const heroBackground =
    heroStyle === "image" &&
    coverImage
      ? `linear-gradient(135deg, ${themeColor}E6, ${secondaryColor}C7), url("${coverImage}") center / cover no-repeat`
      : heroStyle === "solid"
        ? themeColor
        : `linear-gradient(135deg, ${themeColor}, ${secondaryColor}, ${accentColor})`;

  const showPastor =
    church.show_pastor !== false;

  const showPrograms =
    church.show_programs !== false;

  const showPublications =
    church.show_publications !== false;

  const showTeachings =
    church.show_teachings !== false;

  const showDonations =
    church.show_donations !== false &&
    church.donation_enabled !== false;

  const tenantStyle = {
    backgroundColor,
    color: textColor,
    "--tenant-primary":
      themeColor,
    "--tenant-secondary":
      secondaryColor,
    "--tenant-accent":
      accentColor,
    "--tenant-background":
      backgroundColor,
    "--tenant-surface":
      surfaceColor,
    "--tenant-text":
      textColor,
  } as CSSProperties;

  return (
    <main
      data-mpangi-public-page
      data-public-layout={
        publicLayout
      }
      className="min-h-screen overflow-x-hidden pb-24 lg:pb-0"
      style={tenantStyle}
    >
      <style>
        {`
          @keyframes mmFloat {
            0%, 100% {
              transform: translateY(0) scale(1);
            }

            50% {
              transform: translateY(-6px) scale(1.015);
            }
          }

          @keyframes mmPulseRing {
            0%, 100% {
              box-shadow:
                0 0 0 0 rgba(255,255,255,0.25);
            }

            50% {
              box-shadow:
                0 0 0 14px rgba(255,255,255,0);
            }
          }

          .mm-float {
            animation:
              mmFloat 7s ease-in-out infinite;
          }

          .mm-float-reverse {
            animation:
              mmFloat 8s ease-in-out infinite reverse;
          }

          .mm-pulse-ring {
            animation:
              mmPulseRing 4.2s ease-in-out infinite;
          }

          [data-mpangi-public-page]
          .tenant-card {
            background-color:
              var(--tenant-surface);
            border-color:
              color-mix(
                in srgb,
                var(--tenant-primary) 16%,
                transparent
              );
          }

          [data-mpangi-public-page]
          .tenant-primary-text {
            color:
              var(--tenant-primary);
          }

          [data-mpangi-public-page]
          .tenant-soft-background {
            background-color:
              color-mix(
                in srgb,
                var(--tenant-primary) 8%,
                var(--tenant-surface)
              );
          }

          [data-mpangi-public-page]
          .tenant-primary-button {
            background-color:
              var(--tenant-primary);
            color: white;
          }

          [data-mpangi-public-page]
          .tenant-primary-button:hover {
            filter: brightness(0.92);
          }

          [data-public-layout="classic"]
          .tenant-card {
            border-radius: 1rem;
          }

          [data-public-layout="minimal"]
          .tenant-card {
            border-radius: 0.75rem;
            box-shadow: none;
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .mm-float,
            .mm-float-reverse,
            .mm-pulse-ring {
              animation:
                none !important;
            }
          }
        `}
      </style>

      <section
        className="relative overflow-hidden px-4 py-5 text-white md:px-6 md:py-7"
        style={{
          background:
            heroBackground,
        }}
      >
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div className="mm-float relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-2xl md:h-20 md:w-20 md:rounded-[1.6rem]">
                <Image
                  src={logoSrc}
                  alt={
                    `Logo ${churchPublicName}`
                  }
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 md:text-sm">
                  Page publique
                </p>

                <h1 className="break-words text-xl font-extrabold leading-tight md:text-3xl">
                  {churchPublicName}
                </h1>
              </div>
            </div>

            {church.login_enabled && (
              <Link
                href={buildChurchPublicUrl(
                  church,
                  "/login"
                )}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20 hover:bg-white/20"
              >
                <LockKeyhole className="h-4 w-4" />
                Espace église
              </Link>
            )}
          </header>

          <div
            className={[
              "grid gap-5 pb-4 pt-5 lg:items-start",
              showPastor
                ? "lg:grid-cols-[1.05fr_0.95fr]"
                : "lg:grid-cols-1",
            ].join(" ")}
          >
            <div className="min-w-0">
              <p className="inline-flex rounded-full bg-white/15 px-3 py-2 text-xs font-bold ring-1 ring-white/20 md:px-4 md:text-sm">
                {church.public_slogan ||
                  "Bienvenue dans notre communauté"}
              </p>

              <h2 className="mt-3 max-w-3xl break-words text-3xl font-black leading-tight md:text-5xl">
                {welcomeTitle}
              </h2>

              <p className="mt-4 max-w-3xl break-words text-sm leading-7 text-white/90 md:text-lg md:leading-8">
                {church.public_message ||
                  "Bienvenue sur la page publique de notre église."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <HeroButton
                  href={buildChurchPublicUrl(
                    church,
                    "/prayer"
                  )}
                  icon={HeartHandshake}
                  label="Demander une prière"
                  variant="white"
                  primaryColor={
                    themeColor
                  }
                />

                <HeroButton
                  href={buildChurchPublicUrl(
                    church,
                    "/appointment"
                  )}
                  icon={CalendarDays}
                  label="Demander un rendez-vous"
                  variant="glass"
                  primaryColor={
                    themeColor
                  }
                />

                {showDonations && (
                  <a
                    href="#don"
                    className="tenant-primary-button inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-extrabold shadow-lg"
                  >
                    Faire un don
                  </a>
                )}

                <HeroButton
                  href={buildChurchPublicUrl(
                    church,
                    "/join"
                  )}
                  icon={UserPlus}
                  label="Rejoindre l’église"
                  variant="glass"
                  primaryColor={
                    themeColor
                  }
                />

                <HeroButton
                  href={buildChurchPublicUrl(
                    church,
                    "/testimony"
                  )}
                  icon={Sparkles}
                  label="Partager un témoignage"
                  variant="glass"
                  primaryColor={
                    themeColor
                  }
                />

                <HeroButton
                  href="/install"
                  icon={Sparkles}
                  label="Installer l’application"
                  variant="glass"
                  primaryColor={
                    themeColor
                  }
                />
              </div>

              <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/20 md:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 md:text-sm">
                  Parcours d’accompagnement
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StepBox
                    number="01"
                    label="Votre demande est reçue"
                  />

                  <StepBox
                    number="02"
                    label="L’équipe pastorale vous contacte"
                  />

                  <StepBox
                    number="03"
                    label="Un suivi spirituel est organisé"
                  />
                </div>
              </div>
            </div>

            {showPastor && (
              <div className="rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur md:p-4">
                <div
                  className="rounded-3xl p-4 md:p-5"
                  style={{
                    backgroundColor:
                      surfaceColor,
                    color: textColor,
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="mm-float-reverse mm-pulse-ring relative h-32 w-32 overflow-hidden rounded-full border-6 shadow-2xl md:h-44 md:w-44 md:border-8"
                      style={{
                        borderColor:
                          `${themeColor}20`,
                        backgroundColor,
                      }}
                    >
                      <Image
                        src={
                          pastorPhotoSrc
                        }
                        alt={
                          church.pastor_name ||
                          "Pasteur responsable"
                        }
                        fill
                        sizes="(max-width: 768px) 128px, 176px"
                        className="object-cover"
                        priority
                      />
                    </div>

                    <h3
                      className="mt-4 break-words text-lg font-extrabold md:text-xl"
                      style={{
                        color:
                          themeColor,
                      }}
                    >
                      {church.pastor_name ||
                        "Pasteur responsable"}
                    </h3>

                    <p className="mt-1 break-words text-sm font-semibold opacity-65">
                      {church.pastor_title ||
                        "Responsable de l’église"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
                    <Info
                      icon={MapPin}
                      label="Adresse"
                      value={
                        [
                          church.address,
                          church.city,
                          church.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "À compléter"
                      }
                      themeColor={
                        themeColor
                      }
                      backgroundColor={
                        backgroundColor
                      }
                    />

                    <Info
                      icon={Phone}
                      label="Téléphone"
                      value={
                        church.phone ||
                        "À compléter"
                      }
                      themeColor={
                        themeColor
                      }
                      backgroundColor={
                        backgroundColor
                      }
                    />

                    <Info
                      icon={Mail}
                      label="Email"
                      value={
                        church.email ||
                        "À compléter"
                      }
                      themeColor={
                        themeColor
                      }
                      backgroundColor={
                        backgroundColor
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {showPublications && (
        <PublicFeaturedUpdates
          churchId={church.id}
          slug={churchSlug}
        />
      )}

      <PublicLiveStreamSection
        church={church}
      />

      {showTeachings && (
        <section className="mx-auto max-w-6xl px-4 pt-7 md:px-6 md:pt-8">
          <ChurchTeachingsBlock
            churchId={church.id}
            slug={churchSlug}
          />
        </section>
      )}

      <section
        id="bible"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 pt-7 md:px-6 md:pt-8"
      >
        <PublicBibleBlock
          slug={churchSlug}
        />
      </section>

      {(showPrograms ||
        showTeachings) && (
        <section className="mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-8">
          <div
            className={[
              "grid gap-5 lg:gap-6",
              showPrograms &&
              showTeachings
                ? "lg:grid-cols-[0.85fr_1.15fr]"
                : "grid-cols-1",
            ].join(" ")}
          >
            {showPrograms && (
              <div className="tenant-card min-w-0 rounded-3xl border p-4 shadow-sm md:p-6">
                <h3 className="tenant-primary-text text-xl font-extrabold">
                  Programmes
                </h3>

                <p
                  className="mt-4 whitespace-pre-line break-words rounded-2xl p-4 text-sm leading-7 opacity-75 md:mt-5 md:p-5"
                  style={{
                    backgroundColor,
                  }}
                >
                  {church.service_times ||
                    "Les programmes seront bientôt publiés."}
                </p>

                <div className="tenant-soft-background mt-5 rounded-3xl p-4 md:mt-6 md:p-5">
                  <h4 className="tenant-primary-text font-extrabold">
                    Contact rapide
                  </h4>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {church.phone && (
                      <a
                        href={
                          `tel:${church.phone}`
                        }
                        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm"
                        style={{
                          backgroundColor:
                            surfaceColor,
                          color:
                            themeColor,
                        }}
                      >
                        <Phone className="h-4 w-4" />
                        Appeler
                      </a>
                    )}

                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm"
                        style={{
                          backgroundColor:
                            surfaceColor,
                          color:
                            themeColor,
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showTeachings && (
              <div className="tenant-card min-w-0 rounded-3xl border p-4 shadow-sm md:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="tenant-soft-background tenant-primary-text flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl md:h-12 md:w-12">
                    <PlayCircle className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="break-words text-xs font-bold uppercase tracking-[0.16em] md:text-sm md:tracking-[0.2em]"
                      style={{
                        color:
                          secondaryColor,
                      }}
                    >
                      Actualités & enseignements
                    </p>

                    <h3 className="tenant-primary-text break-words text-lg font-extrabold md:text-xl">
                      {church.news_title ||
                        "Actualités et enseignements"}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 break-words text-sm leading-7 opacity-75">
                  {church.news_description ||
                    "Retrouvez bientôt les enseignements, cultes et moments forts de l’église."}
                </p>

                <div
                  className="mt-5 overflow-hidden rounded-3xl border"
                  style={{
                    backgroundColor,
                    borderColor:
                      `${themeColor}20`,
                  }}
                >
                  {youtubeEmbedUrl ? (
                    <iframe
                      src={
                        youtubeEmbedUrl
                      }
                      title="Vidéo YouTube"
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center p-6 text-center md:p-8">
                      <PlayCircle
                        className="h-12 w-12 md:h-14 md:w-14"
                        style={{
                          color:
                            secondaryColor,
                        }}
                      />

                      <p className="mt-4 text-sm font-semibold opacity-70">
                        Aucune vidéo YouTube configurée pour le moment.
                      </p>

                      {church.youtube_channel_url && (
                        <a
                          href={
                            church.youtube_channel_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="tenant-primary-button mt-5 inline-flex rounded-2xl px-5 py-3 text-sm font-bold"
                        >
                          Ouvrir la chaîne YouTube
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showDonations && (
        <div
          id="don"
          className="scroll-mt-24"
        >
          <PublicDonationSection
            church={{
              ...church,
              name:
                churchPublicName,
            }}
          />
        </div>
      )}

      <PublicTestimoniesSection
        churchId={church.id}
      />

      <footer
        className="border-t px-4 py-6 text-center text-sm leading-6 opacity-75 md:px-6"
        style={{
          backgroundColor:
            surfaceColor,
          borderColor:
            `${themeColor}20`,
        }}
      >
        Propulsé par{" "}
        <span
          className="font-bold"
          style={{
            color: themeColor,
          }}
        >
          Mpangi-church
        </span>{" "}
        — AKSANTIC Technology
      </footer>

      <PublicMobileBottomNav
        slug={churchSlug}
      />
    </main>
  );
}

function StepBox({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-2xl font-black">
        {number}
      </p>

      <p className="mt-1 break-words text-sm font-bold">
        {label}
      </p>
    </div>
  );
}

function HeroButton({
  href,
  icon: Icon,
  label,
  variant,
  primaryColor,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  variant: "white" | "glass";
  primaryColor: string;
}) {
  const className =
    variant === "white"
      ? "bg-white shadow-lg shadow-blue-950/20 hover:bg-white/90"
      : "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/20";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm font-extrabold ${className}`}
      style={
        variant === "white"
          ? {
              color:
                primaryColor,
            }
          : undefined
      }
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span className="break-words">
        {label}
      </span>
    </Link>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  themeColor,
  backgroundColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  themeColor: string;
  backgroundColor: string;
}) {
  return (
    <div
      className="flex min-w-0 gap-3 rounded-2xl p-3 md:p-4"
      style={{
        backgroundColor,
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor:
            `${themeColor}15`,
          color: themeColor,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide opacity-50">
          {label}
        </p>

        <p className="mt-1 break-words font-semibold opacity-80">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}