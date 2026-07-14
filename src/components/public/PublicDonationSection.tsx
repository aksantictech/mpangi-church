import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Gift,
  Smartphone,
} from "lucide-react";

type ChurchDonationSectionProps = {
  church: {
    slug?: string | null;
    name?: string | null;
    donation_enabled?: boolean | null;
    donation_message?: string | null;
    donation_mobile_money?: string | null;
    donation_card_url?: string | null;
    donation_bank_account_number?: string | null;
    donation_bank_iban?: string | null;
    donation_cash_enabled?: boolean | null;
  };
};

export default function PublicDonationSection({
  church,
}: ChurchDonationSectionProps) {
  if (church.donation_enabled === false || !church.slug) {
    return null;
  }

  const methods = [
    church.donation_mobile_money
      ? { label: "Mobile Money", icon: Smartphone }
      : null,
    church.donation_card_url
      ? { label: "Carte", icon: CreditCard }
      : null,
    church.donation_bank_account_number || church.donation_bank_iban
      ? { label: "Virement", icon: Banknote }
      : null,
    church.donation_cash_enabled !== false
      ? { label: "Espèces", icon: Gift }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    icon: typeof Gift;
  }>;

  return (
    <section className="mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-8">
      <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-xl shadow-blue-900/15 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
              Soutenir l’œuvre
            </p>

            <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
              Faire un don à {church.name || "l’église"}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              {church.donation_message ||
                "Soutenez la mission, les actions pastorales et les projets de l’église."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {methods.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black ring-1 ring-white/20"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/church/${church.slug}/don`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#03357A] shadow-lg"
          >
            Faire un don
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
