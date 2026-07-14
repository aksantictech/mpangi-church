"use client";

import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  Smartphone,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  DONATION_METHODS,
  DONATION_PURPOSES,
} from "@/lib/donations/constants";

type ChurchDonationConfig = {
  slug: string;
  name: string;
  donationMessage?: string | null;
  defaultCurrency: string;
  allowedCurrencies: string[];
  minimumAmount: number;
  mobileMoneyNumber?: string | null;
  mobileMoneyName?: string | null;
  cardUrl?: string | null;
  cardProviderName?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  bankSwift?: string | null;
  bankDetails?: string | null;
  cashEnabled: boolean;
};

const METHOD_ICONS = {
  mobile_money: Smartphone,
  card: CreditCard,
  bank_transfer: Building2,
  cash: Banknote,
};

export default function PublicDonationForm({
  church,
}: {
  church: ChurchDonationConfig;
}) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(church.defaultCurrency);
  const [method, setMethod] = useState("mobile_money");
  const [purpose, setPurpose] = useState("offering");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const availableMethods = useMemo(
    () =>
      DONATION_METHODS.filter((item) => {
        if (item.value === "mobile_money") {
          return Boolean(church.mobileMoneyNumber);
        }

        if (item.value === "card") {
          return Boolean(church.cardUrl);
        }

        if (item.value === "bank_transfer") {
          return Boolean(
            church.bankAccountNumber || church.bankIban
          );
        }

        if (item.value === "cash") {
          return church.cashEnabled;
        }

        return false;
      }),
    [church]
  );

  async function submitDonation(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/public/church-donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: church.slug,
          amount: Number(amount),
          currency,
          method,
          purpose,
          donorName,
          donorEmail,
          donorPhone,
          note,
          isAnonymous,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Impossible d’enregistrer le don."
        );
      }

      setResult(payload.data);

      if (payload.data?.paymentUrl) {
        window.location.href = payload.data.paymentUrl;
        return;
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
          Intention de don enregistrée
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Votre référence est :
        </p>

        <div className="mt-3 rounded-2xl bg-[#EAF3FA] p-4 text-center text-lg font-black tracking-wide text-[#03357A]">
          {result.reference}
        </div>

        {method === "mobile_money" &&
          result.instructions?.mobileMoney && (
            <div className="mt-5 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
              <p className="font-black text-[#03357A]">
                Effectuez le transfert Mobile Money
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Opérateur :{" "}
                <strong>
                  {result.instructions.mobileMoney.operator}
                </strong>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Numéro :{" "}
                <strong>
                  {result.instructions.mobileMoney.number}
                </strong>
              </p>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Utilisez la référence du don comme motif lorsque le
                service le permet.
              </p>
            </div>
          )}

        {method === "bank_transfer" &&
          result.instructions?.bank && (
            <div className="mt-5 space-y-2 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm text-slate-600">
              <p className="font-black text-[#03357A]">
                Coordonnées bancaires
              </p>
              <p>Banque : {result.instructions.bank.bankName || "-"}</p>
              <p>
                Titulaire :{" "}
                {result.instructions.bank.accountName || "-"}
              </p>
              <p>
                Compte :{" "}
                {result.instructions.bank.accountNumber || "-"}
              </p>
              <p>IBAN : {result.instructions.bank.iban || "-"}</p>
              <p>SWIFT : {result.instructions.bank.swift || "-"}</p>
              {result.instructions.bank.details && (
                <p className="whitespace-pre-line pt-2">
                  {result.instructions.bank.details}
                </p>
              )}
            </div>
          )}

        {method === "cash" && (
          <div className="mt-5 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4 text-sm leading-7 text-slate-600">
            Présentez cette référence lors de la remise de votre don à
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
          <h2 className="text-xl font-black text-[#03357A] sm:text-2xl">
            Préparer mon don
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Choisissez le montant, l’affectation et le mode de
            donation.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

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
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`Minimum ${church.minimumAmount}`}
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 text-base font-bold outline-none focus:border-[#03357A]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-[#03357A]">
            Devise
          </span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 font-bold text-[#03357A] outline-none"
          >
            {church.allowedCurrencies.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-black text-[#03357A]">
          Affectation
        </span>
        <select
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 font-bold text-[#03357A] outline-none"
        >
          {DONATION_PURPOSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-5">
        <legend className="text-sm font-black text-[#03357A]">
          Mode de donation
        </legend>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {availableMethods.map((item) => {
            const Icon = METHOD_ICONS[item.value];
            const active = method === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setMethod(item.value)}
                className={[
                  "min-h-24 rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-[#03357A] bg-[#EAF3FA] ring-2 ring-[#03357A]/10"
                    : "border-[#DCEAF5] bg-[#F8FBFD]",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 text-[#03357A]" />
                <p className="mt-3 font-black text-[#03357A]">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="h-5 w-5 rounded border-[#DCEAF5]"
        />
        <span className="text-sm font-bold text-slate-700">
          Effectuer ce don anonymement
        </span>
      </label>

      {!isAnonymous && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Nom complet
            </span>
            <input
              required
              value={donorName}
              onChange={(event) => setDonorName(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-black text-[#03357A]">
              Téléphone
            </span>
            <input
              value={donorPhone}
              onChange={(event) => setDonorPhone(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 outline-none focus:border-[#03357A]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-black text-[#03357A]">
              Email pour le suivi
            </span>
            <input
              type="email"
              value={donorEmail}
              onChange={(event) => setDonorEmail(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 outline-none focus:border-[#03357A]"
            />
          </label>
        </div>
      )}

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-black text-[#03357A]">
          Message ou précision
        </span>
        <textarea
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 py-3 outline-none focus:border-[#03357A]"
          placeholder="Facultatif"
        />
      </label>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Les informations servent uniquement au suivi du don. Les
          paiements par carte sont effectués sur le service sécurisé
          configuré par l’église.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || availableMethods.length === 0}
        className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/15 disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? "Enregistrement…" : "Continuer"}
      </button>

      {availableMethods.length === 0 && (
        <p className="mt-3 text-center text-sm font-bold text-red-600">
          Aucun mode de donation n’est encore configuré.
        </p>
      )}
    </form>
  );
}
