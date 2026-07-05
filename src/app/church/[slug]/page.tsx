import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicTeachingsSection from "@/components/public/PublicTeachingsSection";
import type { Metadata } from "next";
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
import type { LucideIcon } from "lucide-react";

import PublicDonationSection from "@/components/public/PublicDonationSection";
import PublicLiveStreamSection from "@/components/public/PublicLiveStreamSection";
import PublicMobileActionBar from "@/components/public/PublicMobileActionBar";
import PublicTestimoniesSection from "@/components/public/PublicTestimoniesSection";
import { createClient } from "@/lib/supabase/server";

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
  status: string | null;

  logo_url: string | null;
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
  service_times: string | null;
  public_enabled: boolean | null;
  login_enabled: boolean | null;

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

function getPublicChurchName(church: PublicChurchNameInput) {
  const publicName = church.public_name?.trim();

  if (publicName) {
    return publicName;
  }

  const name = church.name?.trim();

  if (!name) {
    return "Église";
  }

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}

function formatPhoneForWhatsapp(phone: string | null) {
  if (!phone) return null;

  const cleaned = phone.replace(/[^\d]/g, "");

  if (!cleaned) return null;

  return `https://wa.me/${cleaned}`;
}

function getYoutubeEmbedUrl(url: string | null) {
  if (!url) return null;

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  const watchMatch = url.match(/[?&]v=([^&]+)/);

  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

export async function generateMetadata({
  params,
}: PublicChurchPageProps): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select("name, public_name, public_message, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!church) {
    return {
      title: "Église | Mpangi-church",
      manifest: `/church/${slug}/manifest.webmanifest`,
    };
  }

  const churchPublicName = getPublicChurchName(church);

  return {
    title: `${churchPublicName} | Mpangi-church`,
    description:
      church.public_message ||
      `Page officielle de ${churchPublicName} sur Mpangi-church.`,
    manifest: `/church/${slug}/manifest.webmanifest`,
    icons: {
      icon: `/church/${slug}/icon.png`,
      apple: `/church/${slug}/icon.png`,
    },
  };
}

export default async function PublicChurchPage({
  params,
}: PublicChurchPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: churchRaw, error } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      status,
      logo_url,
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
      service_times,
      public_enabled,
      login_enabled,
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

  const church = churchRaw as PublicChurch;
  const churchSlug = church.slug || slug;
  const churchPublicName = getPublicChurchName(church);

  const whatsappUrl = formatPhoneForWhatsapp(church.whatsapp || church.phone);

  const logoSrc =
    church.logo_url || "/images/churches/maison-misericorde-logo.png";

  const pastorPhotoSrc =
    church.pastor_photo_url ||
    "/images/churches/maison-misericorde-pasteur.png";

  const youtubeEmbedUrl = getYoutubeEmbedUrl(church.latest_video_url);

  const welcomeTitle =
    church.public_hero_title?.trim() || `Bienvenue à ${churchPublicName}`;

  return (
    <main className="min-h-screen bg-[#F5F9FC] pb-28 text-[#0F172A] lg:pb-0">
      <style>
        {`
          @keyframes mmFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }

          @keyframes mmPulseRing {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.28); }
            50% { box-shadow: 0 0 0 18px rgba(255,255,255,0); }
          }

          .mm-float {
            animation: mmFloat 6s ease-in-out infinite;
          }

          .mm-float-reverse {
            animation: mmFloat 7s ease-in-out infinite reverse;
          }

          .mm-pulse-ring {
            animation: mmPulseRing 3.8s ease-in-out infinite;
          }
        `}
      </style>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] px-4 py-5 text-white md:px-6">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="mm-float relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white p-3 shadow-2xl md:h-24 md:w-24 md:rounded-[2rem]">
                <Image
                  src={logoSrc}
                  alt={`Logo ${churchPublicName}`}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100 md:text-sm">
                  Page publique
                </p>

                <h1 className="text-xl font-extrabold leading-tight md:text-3xl">
                  {churchPublicName}
                </h1>
              </div>
            </div>

            {church.login_enabled && (
              <Link
                href={`/login?church=${churchSlug}`}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold ring-1 ring-white/20 hover:bg-white/20"
              >
                <LockKeyhole className="h-4 w-4" />
                Espace église
              </Link>
            )}
          </header>

          <div className="grid gap-5 pb-5 pt-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold ring-1 ring-white/20">
                Bienvenue dans notre communauté
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                {welcomeTitle}
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-blue-50 md:text-lg">
                {church.public_message ||
                  "Bienvenue sur la page publique de notre église."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <HeroButton
                  href={`/church/${churchSlug}/prayer`}
                  icon={HeartHandshake}
                  label="Demander une prière"
                  variant="white"
                />

                <HeroButton
                  href={`/church/${churchSlug}/appointment`}
                  icon={CalendarDays}
                  label="Demander un rendez-vous"
                  variant="glass"
                />

                <a
                  href="#don"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#03357A] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-[#022B63]"
                >
                  Faire un don
                </a>

                <HeroButton
                  href={`/church/${churchSlug}/join`}
                  icon={UserPlus}
                  label="Rejoindre l’église"
                  variant="glass"
                />

                <HeroButton
                  href={`/church/${churchSlug}/testimony`}
                  icon={Sparkles}
                  label="Partager un témoignage"
                  variant="glass"
                />

                <HeroButton
                  href={`/church/${churchSlug}/install`}
                  icon={Sparkles}
                  label="Installer l’application"
                  variant="glass"
                />
              </div>

              <div className="mt-5 rounded-3xl bg-white/10 p-5 ring-1 ring-white/20">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                  Parcours d’accompagnement
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StepBox number="01" label="Votre demande est reçue" />
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

            <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[1.6rem] bg-white p-5 text-[#0F172A]">
                <div className="flex flex-col items-center text-center">
                  <div className="mm-float-reverse mm-pulse-ring relative h-44 w-44 overflow-hidden rounded-full border-8 border-[#EAF3FA] bg-[#F8FBFD] shadow-2xl">
                    <Image
                      src={pastorPhotoSrc}
                      alt={church.pastor_name || "Pasteur responsable"}
                      fill
                      sizes="176px"
                      className="object-cover"
                      priority
                    />
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold text-[#03357A]">
                    {church.pastor_name || "Pasteur responsable"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {church.pastor_title || "Responsable de l’église"}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <Info
                    icon={MapPin}
                    label="Adresse"
                    value={
                      [church.address, church.city, church.country]
                        .filter(Boolean)
                        .join(", ") || "À compléter"
                    }
                  />

                  <Info
                    icon={Phone}
                    label="Téléphone"
                    value={church.phone || "À compléter"}
                  />

                  <Info
                    icon={Mail}
                    label="Email"
                    value={church.email || "À compléter"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicLiveStreamSection church={church as any} />
      <PublicTeachingsSection churchId={church.id} />

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#03357A]">
              Programmes
            </h3>

            <p className="mt-5 whitespace-pre-line rounded-2xl bg-[#F8FBFD] p-5 text-sm leading-7 text-slate-600">
              {church.service_times || "Les programmes seront bientôt publiés."}
            </p>

            <div className="mt-6 rounded-3xl bg-[#EAF3FA] p-5">
              <h4 className="font-extrabold text-[#03357A]">
                Contact rapide
              </h4>

              <div className="mt-4 flex flex-wrap gap-3">
                {church.phone && (
                  <a
                    href={`tel:${church.phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#F8FBFD]"
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#F8FBFD]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                <PlayCircle className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                  Actualités & enseignements
                </p>

                <h3 className="text-xl font-extrabold text-[#03357A]">
                  {church.news_title || "Actualités et enseignements"}
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {church.news_description ||
                "Retrouvez bientôt les enseignements, cultes et moments forts de l’église."}
            </p>

            <div className="mt-5 overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD]">
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  title="Vidéo YouTube"
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center p-8 text-center">
                  <PlayCircle className="h-14 w-14 text-[#3F79B3]" />

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Aucune vidéo YouTube configurée pour le moment.
                  </p>

                  {church.youtube_channel_url && (
                    <a
                      href={church.youtube_channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-bold text-white hover:bg-[#022B63]"
                    >
                      Ouvrir la chaîne YouTube
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div id="don">
        <PublicDonationSection
          church={{
            ...church,
            name: churchPublicName,
          }}
        />
      </div>

      <PublicTestimoniesSection churchId={church.id} />

      <PublicMobileActionBar churchId={church.id} slug={churchSlug} />

      <footer className="border-t border-[#DCEAF5] bg-white px-6 py-6 text-center text-sm text-slate-500">
        Propulsé par{" "}
        <span className="font-bold text-[#03357A]">Mpangi-church</span> —
        AKSANTIC Technology
      </footer>
    </main>
  );
}

function StepBox({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-2xl font-black">{number}</p>
      <p className="mt-1 text-sm font-bold">{label}</p>
    </div>
  );
}

function HeroButton({
  href,
  icon: Icon,
  label,
  variant,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  variant: "white" | "glass";
}) {
  const className =
    variant === "white"
      ? "bg-white text-[#03357A] shadow-lg shadow-blue-950/20 hover:bg-[#EAF3FA]"
      : "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/20";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold ${className}`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#F8FBFD] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 font-semibold text-slate-700">{value || "-"}</p>
      </div>
    </div>
  );
}