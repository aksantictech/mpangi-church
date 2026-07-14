import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, HeartHandshake, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import PublicDonationForm from "@/components/donations/PublicDonationForm";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  return {
    title: `Faire un don | ${slug} | Mpangi-church`,
    description:
      "Soutenez la mission de l’église par Mobile Money, carte, virement ou espèces.",
  };
}

export default async function PublicDonationPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: church, error } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      public_name,
      slug,
      status,
      public_enabled,
      logo_url,
      donation_enabled,
      donation_message,
      donation_default_currency,
      donation_allowed_currencies,
      donation_min_amount,
      donation_mobile_money,
      donation_mobile_money_name,
      donation_card_url,
      donation_card_provider_name,
      donation_bank_name,
      donation_bank_account_name,
      donation_bank_account_number,
      donation_bank_iban,
      donation_bank_swift,
      donation_bank_details,
      donation_cash_enabled
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    error ||
    !church ||
    church.status !== "active" ||
    !church.public_enabled ||
    church.donation_enabled === false
  ) {
    notFound();
  }

  const churchName =
    church.public_name?.trim() ||
    church.name?.trim() ||
    "Église";

  const currencies = Array.isArray(church.donation_allowed_currencies)
    ? church.donation_allowed_currencies
        .map((item: string) => item.toUpperCase())
        .filter(Boolean)
    : [church.donation_default_currency || "CDF"];

  const defaultCurrency = currencies.includes(
    church.donation_default_currency
  )
    ? church.donation_default_currency
    : currencies[0] || "CDF";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F9FC] pb-24 lg:pb-10">
      <section className="bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] px-4 py-5 text-white sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/church/${slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-black ring-1 ring-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’église
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                Soutenir la mission
              </p>

              <h1 className="mt-2 break-words text-3xl font-black sm:text-5xl">
                Faire un don à {churchName}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 sm:text-base">
                {church.donation_message ||
                  "Votre générosité soutient la mission, l’accompagnement pastoral et les actions de l’église."}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/20">
              {church.logo_url ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white p-2">
                  <Image
                    src={church.logo_url}
                    alt={`Logo ${churchName}`}
                    fill
                    sizes="64px"
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <HeartHandshake className="h-8 w-8" />
                </div>
              )}

              <div>
                <p className="font-black">{churchName}</p>
                <p className="mt-1 text-xs text-blue-100">
                  Plateforme sécurisée Mpangi-church
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[1fr_340px]">
        <PublicDonationForm
          church={{
            slug,
            name: churchName,
            donationMessage: church.donation_message,
            defaultCurrency,
            allowedCurrencies: currencies,
            minimumAmount: Number(church.donation_min_amount || 1),
            mobileMoneyNumber: church.donation_mobile_money,
            mobileMoneyName: church.donation_mobile_money_name,
            cardUrl: church.donation_card_url,
            cardProviderName: church.donation_card_provider_name,
            bankName: church.donation_bank_name,
            bankAccountName: church.donation_bank_account_name,
            bankAccountNumber: church.donation_bank_account_number,
            bankIban: church.donation_bank_iban,
            bankSwift: church.donation_bank_swift,
            bankDetails: church.donation_bank_details,
            cashEnabled: church.donation_cash_enabled !== false,
          }}
        />

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-5 shadow-sm">
            <ShieldCheck className="h-7 w-7 text-green-600" />
            <h2 className="mt-4 text-lg font-black text-[#03357A]">
              Transparence et suivi
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Chaque intention reçoit une référence unique. L’équipe
              financière de l’église confirme ensuite la réception.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[#03357A] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              Affectations disponibles
            </p>
            <ul className="mt-4 space-y-3 text-sm font-bold">
              <li>Offrandes et dîmes</li>
              <li>Mission et évangélisation</li>
              <li>Construction et patrimoine</li>
              <li>Actions sociales</li>
              <li>Actions de grâce</li>
            </ul>
          </div>
        </aside>
      </section>

      <PublicMobileBottomNav slug={slug} />
    </main>
  );
}
