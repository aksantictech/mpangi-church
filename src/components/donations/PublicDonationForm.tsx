"use client";

import {
  ArrowLeft,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Smartphone,
} from "lucide-react";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  DONATION_PAYMENT_CHANNELS,
  DONATION_PURPOSES,
  type DonationPaymentChannel,
} from "@/lib/donations/constants";

type MobileMoneyChannel = {
  value:
    | "mpesa"
    | "airtel_money"
    | "orange_money";
  label: string;
  enabled: boolean;
  number?: string | null;
  accountName?: string | null;
};

type ChurchDonationConfig = {
  slug: string;
  name: string;
  donationMessage?: string | null;
  defaultCurrency: string;
  allowedCurrencies: string[];
  minimumAmount: number;
  mobileMoneyChannels: MobileMoneyChannel[];
  cardEnabled: boolean;
  cardUrl?: string | null;
  cardProviderName?: string | null;
  bankEnabled: boolean;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  bankSwift?: string | null;
  bankDetails?: string | null;
  cashEnabled: boolean;
};

type PaymentOption = {
  value: DonationPaymentChannel;
  label: string;
  method:
    | "mobile_money"
    | "card"
    | "bank_transfer"
    | "cash";
  description: string;
};

type DonationResult = {
  reference: string;
  status: string;
  confirmationUrl: string;
  paymentUrl?: string | null;
  instructions?: {
    mobileMoney?: {
      operator?: string | null;
      number?: string | null;
      accountName?: string | null;
    } | null;
    bank?: {
      bankName?: string | null;
      accountName?: string | null;
      accountNumber?: string | null;
      iban?: string | null;
      swift?: string | null;
      details?: string | null;
    } | null;
    receiptEmail?: string | null;
  };
};

const CHANNEL_ICONS: Record<
  DonationPaymentChannel,
  typeof Smartphone
> = {
  mpesa: Smartphone,
  airtel_money: Smartphone,
  orange_money: Smartphone,
  card: CreditCard,
  bank_transfer: Building2,
  cash: Banknote,
};

export default function PublicDonationForm({
  church,
}: {
  church: ChurchDonationConfig;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] =
    useState(church.defaultCurrency);
  const [purpose, setPurpose] =
    useState("offering");

  const [donorName, setDonorName] =
    useState("");
  const [donorEmail, setDonorEmail] =
    useState("");
  const [donorPhone, setDonorPhone] =
    useState("");
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] =
    useState(false);

  const [channel, setChannel] =
    useState<DonationPaymentChannel | "">("");

  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<DonationResult | null>(null);

  const paymentOptions =
    useMemo<PaymentOption[]>(() => {
      const options: PaymentOption[] = [];

      for (const item of church.mobileMoneyChannels) {
        if (item.enabled && item.number) {
          options.push({
            value: item.value,
            label: item.label,
            method: "mobile_money",
            description:
              "Transfert vers le numéro officiel de l’église.",
          });
        }
      }

      if (church.cardEnabled && church.cardUrl) {
        options.push({
          value: "card",
          label:
            church.cardProviderName ||
            "Carte bancaire",
          method: "card",
          description:
            "Ouverture de la page sécurisée du prestataire.",
        });
      }

      if (
        church.bankEnabled &&
        (
          church.bankAccountNumber ||
          church.bankIban
        )
      ) {
        options.push({
          value: "bank_transfer",
          label: "Virement bancaire",
          method: "bank_transfer",
          description:
            "Coordonnées bancaires officielles de l’église.",
        });
      }

      if (church.cashEnabled) {
        options.push({
          value: "cash",
          label: "Espèces",
          method: "cash",
          description:
            "Enregistrez une référence avant la remise.",
        });
      }

      return options;
    }, [church]);

  const selectedOption =
    paymentOptions.find(
      (item) => item.value === channel
    ) || null;

  function continueToPayment() {
    setError("");

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < church.minimumAmount
    ) {
      setError(
        `Le montant minimum est de ${church.minimumAmount} ${currency}.`
      );
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      setError(
        "Renseignez votre nom ou activez le don anonyme."
      );
      return;
    }

    if (paymentOptions.length === 0) {
      setError(
        "Aucun moyen de paiement n’est configuré."
      );
      return;
    }

    if (!channel) {
      setChannel(paymentOptions[0].value);
    }

    setStep(2);
  }

  async function submitDonation(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!selectedOption) {
      setError(
        "Choisissez un moyen de paiement."
      );
      return;
    }

    if (
      selectedOption.method ===
        "mobile_money" &&
      !donorPhone.trim()
    ) {
      setError(
        "Le numéro de téléphone du donateur est requis pour le suivi Mobile Money."
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "/api/public/church-donations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: church.slug,
            amount: Number(amount),
            currency,
            channel: selectedOption.value,
            purpose,
            donorName,
            donorEmail,
            donorPhone,
            note,
            isAnonymous,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Impossible d’enregistrer le don."
        );
      }

      setResult(payload.data);

      if (payload.data?.paymentUrl) {
        window.location.assign(
          payload.data.paymentUrl
        );
      }
    } catch (submitError: any) {
      setError(
        submitError?.message ||
          "Une erreur a empêché l’enregistrement."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <section className="rounded-[1.75rem] border border-green-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-black text-[#03357A]">
          Don enregistré
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Conservez cette référence :
        </p>

        <div className="mt-3 rounded-2xl bg-[#EAF3FA] p-4 text-center text-lg font-black tracking-wide text-[#03357A]">
          {result.reference}
        </div>

        {result.instructions?.mobileMoney && (
          <div className="mt-5 rounded-2xl border border-[#C9DBEA] bg-[#F8FBFD] p-4">
            <p className="font-black text-[#03357A]">
              Effectuez maintenant le transfert
            </p>

            <dl className="mt-3 grid gap-2 text-sm text-slate-700">
              <div>
                <dt className="font-bold">
                  Opérateur
                </dt>
                <dd>
                  {result.instructions.mobileMoney.operator ||
                    "-"}
                </dd>
              </div>

              <div>
                <dt className="font-bold">
                  Numéro
                </dt>
                <dd className="text-lg font-black text-[#03357A]">
                  {result.instructions.mobileMoney.number ||
                    "-"}
                </dd>
              </div>

              {result.instructions.mobileMoney
                .accountName && (
                <div>
                  <dt className="font-bold">
                    Titulaire
                  </dt>
                  <dd>
                    {
                      result.instructions.mobileMoney
                        .accountName
                    }
                  </dd>
                </div>
              )}
            </dl>

            <p className="mt-3 text-xs leading-6 text-slate-500">
              Indiquez la référence du don comme motif lorsque
              l’opérateur le permet. L’équipe financière confirmera
              ensuite la réception.
            </p>
          </div>
        )}

        {result.instructions?.bank && (
          <div className="mt-5 space-y-2 rounded-2xl border border-[#C9DBEA] bg-[#F8FBFD] p-4 text-sm text-slate-700">
            <p className="font-black text-[#03357A]">
              Coordonnées bancaires
            </p>
            <p>
              Banque :{" "}
              {result.instructions.bank.bankName ||
                "-"}
            </p>
            <p>
              Titulaire :{" "}
              {result.instructions.bank.accountName ||
                "-"}
            </p>
            <p>
              Compte :{" "}
              {result.instructions.bank
                .accountNumber || "-"}
            </p>
            <p>
              IBAN :{" "}
              {result.instructions.bank.iban ||
                "-"}
            </p>
            <p>
              SWIFT :{" "}
              {result.instructions.bank.swift ||
                "-"}
            </p>

            {result.instructions.bank.details && (
              <p className="whitespace-pre-line pt-2">
                {
                  result.instructions.bank
                    .details
                }
              </p>
            )}
          </div>
        )}

        {selectedOption?.method === "cash" && (
          <div className="mt-5 rounded-2xl border border-[#C9DBEA] bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-700">
            Présentez la référence lors de la remise du don à
            l’église.
          </div>
        )}

        <a
          href={result.confirmationUrl}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
        >
          Voir la confirmation
        </a>
      </section>
    );
  }

  return (
    <form
      onSubmit={submitDonation}
      className="rounded-[1.75rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <HeartHandshake className="h-6 w-6" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3F79B3]">
            Étape {step} sur 2
          </p>

          <h2 className="mt-1 text-xl font-black text-[#03357A] sm:text-2xl">
            {step === 1
              ? "Informations du don"
              : "Choisissez le paiement"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {step === 1
              ? "Montant, affectation et coordonnées de suivi."
              : "Sélectionnez le canal qui sera utilisé pour ce don."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div
          className={[
            "h-2 rounded-full",
            step >= 1
              ? "bg-[#2563EB]"
              : "bg-slate-200",
          ].join(" ")}
        />
        <div
          className={[
            "h-2 rounded-full",
            step >= 2
              ? "bg-[#8B5CF6]"
              : "bg-slate-200",
          ].join(" ")}
        />
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {step === 1 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_150px]">
            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Montant
              </span>
              <input
                required
                type="number"
                inputMode="decimal"
                min={church.minimumAmount}
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder={`Minimum ${church.minimumAmount}`}
                className="mpangi-form-control"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Devise
              </span>
              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value)
                }
                className="mpangi-form-control"
              >
                {church.allowedCurrencies.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Affectation
            </span>
            <select
              value={purpose}
              onChange={(event) =>
                setPurpose(event.target.value)
              }
              className="mpangi-form-control"
            >
              {DONATION_PURPOSES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) =>
                setIsAnonymous(
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded border-[#C9DBEA]"
            />
            <span className="text-sm font-bold text-slate-700">
              Effectuer ce don anonymement
            </span>
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {!isAnonymous && (
              <label className="space-y-2">
                <span className="text-sm font-black text-[#03357A]">
                  Nom complet
                </span>
                <input
                  value={donorName}
                  onChange={(event) =>
                    setDonorName(
                      event.target.value
                    )
                  }
                  className="mpangi-form-control"
                  placeholder="Nom du donateur"
                />
              </label>
            )}

            <label className="space-y-2">
              <span className="text-sm font-black text-[#03357A]">
                Téléphone
              </span>
              <input
                value={donorPhone}
                onChange={(event) =>
                  setDonorPhone(
                    event.target.value
                  )
                }
                className="mpangi-form-control"
                placeholder="+243..."
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-black text-[#03357A]">
                Email pour le suivi
              </span>
              <input
                type="email"
                value={donorEmail}
                onChange={(event) =>
                  setDonorEmail(
                    event.target.value
                  )
                }
                className="mpangi-form-control"
                placeholder="Facultatif"
              />
            </label>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Message ou précision
            </span>
            <textarea
              rows={4}
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              className="mpangi-form-control min-h-28 py-3"
              placeholder="Facultatif"
            />
          </label>

          <button
            type="button"
            onClick={continueToPayment}
            className="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-2xl bg-[#03357A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15"
          >
            Continuer vers le paiement
          </button>
        </>
      ) : (
        <>
          <fieldset className="mt-6">
            <legend className="text-sm font-black text-[#03357A]">
              Moyens disponibles
            </legend>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {paymentOptions.map((item) => {
                const Icon =
                  CHANNEL_ICONS[item.value];

                const active =
                  channel === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setChannel(item.value)
                    }
                    className={[
                      "min-h-28 rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-[#03357A] bg-[#EAF3FA] ring-2 ring-[#03357A]/10"
                        : "border-[#C9DBEA] bg-[#F8FBFD]",
                    ].join(" ")}
                  >
                    <Icon className="h-6 w-6 text-[#03357A]" />
                    <p className="mt-3 font-black text-[#03357A]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 rounded-2xl bg-[#EAF3FA] p-4">
            <p className="text-sm font-black text-[#03357A]">
              Résumé du don
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {amount} {currency} ·{" "}
              {
                DONATION_PURPOSES.find(
                  (item) =>
                    item.value === purpose
                )?.label
              }
            </p>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Mpangi-Church ne demande jamais le numéro complet
              d’une carte bancaire. La saisie de carte se fait
              uniquement sur la page sécurisée du prestataire.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF3FA] px-5 text-sm font-black text-[#03357A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Modifier le don
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                paymentOptions.length === 0 ||
                !channel
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 text-sm font-black text-white disabled:opacity-50"
            >
              {submitting && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {submitting
                ? "Préparation…"
                : selectedOption?.method ===
                    "card"
                  ? "Ouvrir le paiement sécurisé"
                  : "Enregistrer et afficher les instructions"}
            </button>
          </div>

          {paymentOptions.length === 0 && (
            <p className="mt-3 text-center text-sm font-bold text-red-600">
              Aucun moyen de paiement n’est encore configuré.
            </p>
          )}
        </>
      )}
    </form>
  );
}
