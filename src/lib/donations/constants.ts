export const DONATION_METHODS = [
  {
    value: "mobile_money",
    label: "Mobile Money",
    description:
      "M-Pesa, Airtel Money ou Orange Money.",
  },
  {
    value: "card",
    label: "Carte bancaire",
    description:
      "Paiement via la page sécurisée du prestataire de l’église.",
  },
  {
    value: "bank_transfer",
    label: "Virement bancaire",
    description:
      "Paiement avec les coordonnées bancaires officielles.",
  },
  {
    value: "cash",
    label: "Espèces",
    description:
      "Déclaration suivie d’une remise auprès de l’église.",
  },
] as const;

export const DONATION_PAYMENT_CHANNELS = [
  {
    value: "mpesa",
    method: "mobile_money",
    label: "M-Pesa",
  },
  {
    value: "airtel_money",
    method: "mobile_money",
    label: "Airtel Money",
  },
  {
    value: "orange_money",
    method: "mobile_money",
    label: "Orange Money",
  },
  {
    value: "card",
    method: "card",
    label: "Carte bancaire",
  },
  {
    value: "bank_transfer",
    method: "bank_transfer",
    label: "Virement bancaire",
  },
  {
    value: "cash",
    method: "cash",
    label: "Espèces",
  },
] as const;

export const DONATION_PURPOSES = [
  { value: "offering", label: "Offrande" },
  { value: "tithe", label: "Dîme" },
  { value: "thanksgiving", label: "Action de grâce" },
  {
    value: "construction",
    label: "Construction / patrimoine",
  },
  {
    value: "mission",
    label: "Mission / évangélisation",
  },
  { value: "social", label: "Action sociale" },
  { value: "other", label: "Autre" },
] as const;

export const DONATION_STATUSES = [
  { value: "pending", label: "En attente" },
  {
    value: "awaiting_payment",
    label: "Paiement attendu",
  },
  { value: "submitted", label: "Déclaré" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
  { value: "failed", label: "Échec" },
] as const;

export type DonationMethod =
  (typeof DONATION_METHODS)[number]["value"];

export type DonationPaymentChannel =
  (typeof DONATION_PAYMENT_CHANNELS)[number]["value"];

export type DonationPurpose =
  (typeof DONATION_PURPOSES)[number]["value"];

export type DonationStatus =
  (typeof DONATION_STATUSES)[number]["value"];

export function getDonationPurposeLabel(
  value: string
) {
  return (
    DONATION_PURPOSES.find(
      (item) => item.value === value
    )?.label || "Autre"
  );
}

export function getDonationMethodLabel(
  value: string
) {
  return (
    DONATION_METHODS.find(
      (item) => item.value === value
    )?.label || value
  );
}

export function getDonationChannelLabel(
  value: string | null | undefined
) {
  if (!value) return "";

  return (
    DONATION_PAYMENT_CHANNELS.find(
      (item) => item.value === value
    )?.label || value
  );
}

export function getDonationStatusLabel(
  value: string
) {
  return (
    DONATION_STATUSES.find(
      (item) => item.value === value
    )?.label || value
  );
}

export function formatDonationAmount(
  amount: number | string,
  currency: string
) {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "CDF",
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
