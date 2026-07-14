export const DONATION_METHODS = [
  {
    value: "mobile_money",
    label: "Mobile Money",
    description: "M-Pesa, Airtel Money, Orange Money ou autre portefeuille.",
  },
  {
    value: "card",
    label: "Carte bancaire",
    description: "Paiement via le lien sécurisé configuré par l’église.",
  },
  {
    value: "bank_transfer",
    label: "Virement bancaire",
    description: "Utilisez les coordonnées bancaires de l’église.",
  },
  {
    value: "cash",
    label: "Espèces",
    description: "Déclarez votre intention et remettez le don à l’église.",
  },
] as const;

export const DONATION_PURPOSES = [
  { value: "offering", label: "Offrande" },
  { value: "tithe", label: "Dîme" },
  { value: "thanksgiving", label: "Action de grâce" },
  { value: "construction", label: "Construction / patrimoine" },
  { value: "mission", label: "Mission / évangélisation" },
  { value: "social", label: "Action sociale" },
  { value: "other", label: "Autre" },
] as const;

export const DONATION_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "awaiting_payment", label: "Paiement attendu" },
  { value: "submitted", label: "Déclaré" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
  { value: "failed", label: "Échec" },
] as const;

export type DonationMethod =
  (typeof DONATION_METHODS)[number]["value"];

export type DonationPurpose =
  (typeof DONATION_PURPOSES)[number]["value"];

export type DonationStatus =
  (typeof DONATION_STATUSES)[number]["value"];

export function getDonationPurposeLabel(value: string) {
  return (
    DONATION_PURPOSES.find((item) => item.value === value)?.label ||
    "Autre"
  );
}

export function getDonationMethodLabel(value: string) {
  return (
    DONATION_METHODS.find((item) => item.value === value)?.label ||
    value
  );
}

export function getDonationStatusLabel(value: string) {
  return (
    DONATION_STATUSES.find((item) => item.value === value)?.label ||
    value
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
