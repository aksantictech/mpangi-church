import Link from "next/link";
import {
  Banknote,
  CreditCard,
  ExternalLink,
  HeartHandshake,
  Landmark,
  Smartphone,
} from "lucide-react";

type PublicDonationSectionProps = {
  church: {
    name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    donation_enabled?: boolean | null;
    donation_message?: string | null;
    donation_mobile_money?: string | null;
    donation_mobile_money_name?: string | null;
    donation_card_url?: string | null;
    donation_bank_name?: string | null;
    donation_bank_account_name?: string | null;
    donation_bank_account_number?: string | null;
    donation_bank_iban?: string | null;
    donation_bank_swift?: string | null;
    donation_bank_details?: string | null;
  };
};

function getWhatsappLink(value?: string | null) {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");

  if (!digits) return null;

  return `https://wa.me/${digits}`;
}

export default function PublicDonationSection({
  church,
}: PublicDonationSectionProps) {
  if (church.donation_enabled === false) {
    return null;
  }

  const mobileMoneyNumber =
    church.donation_mobile_money || church.whatsapp || church.phone || "";

  const whatsappLink = getWhatsappLink(church.whatsapp || church.phone);

  const bankItems = [
    {
      label: "Banque",
      value: church.donation_bank_name,
    },
    {
      label: "Nom du compte",
      value: church.donation_bank_account_name,
    },
    {
      label: "Numéro de compte",
      value: church.donation_bank_account_number,
    },
    {
      label: "IBAN",
      value: church.donation_bank_iban,
    },
    {
      label: "SWIFT",
      value: church.donation_bank_swift,
    },
  ].filter((item) => item.value);

  return (
    <section id="don" className="mx-auto mt-10 max-w-6xl px-4">
      <div className="overflow-hidden rounded-[2rem] border border-[#DCEAF5] bg-white shadow-xl shadow-blue-950/5">
        <div className="bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-blue-50 ring-1 ring-white/20">
                <HeartHandshake className="h-4 w-4" />
                Faire un don
              </div>

              <h2 className="mt-5 text-3xl font-extrabold md:text-4xl">
                Soutenir {church.name || "l’église"}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
                {church.donation_message ||
                  "Participez à l’avancement de l’œuvre par vos dons, offrandes et contributions."}
              </p>
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                Contacter l’église
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-3 md:p-6">
          <DonationCard
            icon={Smartphone}
            title="Mobile Money"
            description="Envoyez votre don par Mobile Money, Airtel Money, Orange Money ou M-Pesa selon les moyens disponibles."
          >
            {mobileMoneyNumber ? (
              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Numéro
                </p>

                <p className="mt-2 text-lg font-extrabold text-[#03357A]">
                  {mobileMoneyNumber}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {church.donation_mobile_money_name ||
                    church.name ||
                    "Nom du bénéficiaire à confirmer"}
                </p>
              </div>
            ) : (
              <EmptyDonationInfo message="Numéro Mobile Money à configurer." />
            )}
          </DonationCard>

          <DonationCard
            icon={CreditCard}
            title="Carte bancaire"
            description="Utilisez un lien de paiement sécurisé si l’église a configuré un prestataire de paiement."
          >
            {church.donation_card_url ? (
              <a
                href={church.donation_card_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#022B63]"
              >
                Donner par carte
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <EmptyDonationInfo message="Lien de paiement carte à configurer." />
            )}
          </DonationCard>

          <DonationCard
            icon={Landmark}
            title="Virement bancaire"
            description="Effectuez un virement bancaire avec les informations du compte de l’église."
          >
            {bankItems.length > 0 ? (
              <div className="space-y-3 rounded-2xl bg-[#F8FBFD] p-4">
                {bankItems.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>

                    <p className="mt-1 break-words text-sm font-extrabold text-[#03357A]">
                      {item.value}
                    </p>
                  </div>
                ))}

                {church.donation_bank_details && (
                  <p className="border-t border-[#DCEAF5] pt-3 text-sm leading-6 text-slate-600">
                    {church.donation_bank_details}
                  </p>
                )}
              </div>
            ) : (
              <EmptyDonationInfo message="Coordonnées bancaires à configurer." />
            )}
          </DonationCard>
        </div>

        <div className="border-t border-[#DCEAF5] bg-[#F8FBFD] px-5 py-4 text-center text-xs font-semibold text-slate-500 md:px-6">
          Les informations de paiement doivent être vérifiées auprès de l’église
          avant tout transfert important.
        </div>
      </div>
    </section>
  );
}

function DonationCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-[#03357A]">{title}</h3>

      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">{children}</div>
    </article>
  );
}

function EmptyDonationInfo({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4 text-sm font-semibold leading-6 text-slate-500">
      <Banknote className="mb-2 h-5 w-5 text-[#3F79B3]" />
      {message}
    </div>
  );
}