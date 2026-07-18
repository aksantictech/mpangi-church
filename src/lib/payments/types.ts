export type PaymentKind = "donation" | "subscription" | "invoice" | "other";

export type PaymentStatus =
  | "created"
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "partially_refunded";

export type CreateDonationPaymentInput = {
  churchId: string;
  donationId: string;
  reference: string;
  amount: number;
  currency: string;
  paymentChannel: string;
  provider?: string | null;
  checkoutUrl?: string | null;
  returnUrl?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdatePaymentStatusInput = {
  churchId: string;
  transactionId: string;
  status: PaymentStatus;
  failureCode?: string | null;
  failureMessage?: string | null;
  providerTransactionId?: string | null;
  providerResponse?: Record<string, unknown>;
};

export type PaymentTransactionSummary = {
  id: string;
  status: PaymentStatus;
  idempotencyKey: string;
  created: boolean;
};
