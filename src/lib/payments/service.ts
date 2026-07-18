import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreateDonationPaymentInput,
  PaymentStatus,
  PaymentTransactionSummary,
  UpdatePaymentStatusInput,
} from "@/lib/payments/types";

type AdminClient = ReturnType<typeof createAdminClient>;

type PaymentTransactionRow = {
  id: string;
  status: PaymentStatus;
  idempotency_key: string;
};

const STATUS_TIMESTAMPS: Partial<Record<PaymentStatus, string>> = {
  processing: "processing_at",
  succeeded: "paid_at",
  failed: "failed_at",
  cancelled: "cancelled_at",
  refunded: "refunded_at",
  partially_refunded: "refunded_at",
};

function normalizeCurrency(value: string) {
  const currency = String(value || "CDF")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Devise de paiement invalide.");
  }

  return currency;
}

function normalizeProvider(value: string | null | undefined) {
  return (
    String(value || "manual")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "manual"
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function findTransactionByIdempotencyKey(
  admin: AdminClient,
  churchId: string,
  idempotencyKey: string,
) {
  const { data, error } = await admin
    .from("church_payment_transactions")
    .select("id, status, idempotency_key")
    .eq("church_id", churchId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as PaymentTransactionRow | null;
}

export async function createPendingDonationPayment(
  input: CreateDonationPaymentInput,
  adminClient?: AdminClient,
): Promise<PaymentTransactionSummary> {
  const admin = adminClient || createAdminClient();
  const amount = Number(input.amount);

  if (!input.churchId || !input.donationId || !input.reference) {
    throw new Error("Informations de transaction incomplètes.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Montant de transaction invalide.");
  }

  const idempotencyKey = `donation:${input.donationId}:initial`;
  const existing = await findTransactionByIdempotencyKey(
    admin,
    input.churchId,
    idempotencyKey,
  );

  if (existing) {
    return {
      id: existing.id,
      status: existing.status,
      idempotencyKey: existing.idempotency_key,
      created: false,
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("church_payment_transactions")
    .insert({
      church_id: input.churchId,
      donation_id: input.donationId,
      kind: "donation",
      provider: normalizeProvider(input.provider || input.paymentChannel),
      external_reference: input.reference,
      idempotency_key: idempotencyKey,
      status: "pending",
      amount,
      currency: normalizeCurrency(input.currency),
      payment_channel: input.paymentChannel,
      checkout_url: input.checkoutUrl || null,
      return_url: input.returnUrl || null,
      metadata: input.metadata || {},
      created_by: input.createdBy || null,
      requested_at: now,
    })
    .select("id, status, idempotency_key")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      const concurrent = await findTransactionByIdempotencyKey(
        admin,
        input.churchId,
        idempotencyKey,
      );

      if (concurrent) {
        return {
          id: concurrent.id,
          status: concurrent.status,
          idempotencyKey: concurrent.idempotency_key,
          created: false,
        };
      }
    }

    throw new Error(error?.message || "Transaction non enregistrée.");
  }

  const transaction = data as PaymentTransactionRow;

  const { error: donationError } = await admin
    .from("church_donations")
    .update({
      payment_transaction_id: transaction.id,
      payment_attempt_count: 1,
      last_payment_error: null,
      last_payment_attempt_at: now,
    })
    .eq("id", input.donationId)
    .eq("church_id", input.churchId);

  if (donationError) {
    throw new Error(donationError.message);
  }

  return {
    id: transaction.id,
    status: transaction.status,
    idempotencyKey: transaction.idempotency_key,
    created: true,
  };
}

export async function updatePaymentTransactionStatus(
  input: UpdatePaymentStatusInput,
  adminClient?: AdminClient,
) {
  const admin = adminClient || createAdminClient();
  const now = new Date().toISOString();
  const timestampColumn = STATUS_TIMESTAMPS[input.status];

  const updates: Record<string, unknown> = {
    status: input.status,
    provider_response: input.providerResponse || {},
    failure_code: input.failureCode || null,
    failure_message: input.failureMessage || null,
  };

  if (input.providerTransactionId) {
    updates.provider_transaction_id = input.providerTransactionId;
  }

  if (timestampColumn) updates[timestampColumn] = now;

  const { data, error } = await admin
    .from("church_payment_transactions")
    .update(updates)
    .eq("id", input.transactionId)
    .eq("church_id", input.churchId)
    .select("id, status")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Transaction de paiement introuvable.");

  return data;
}

export function paymentErrorMessage(error: unknown) {
  return getErrorMessage(error, "Opération de paiement impossible.");
}
