import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DONATION_METHODS,
  DONATION_PURPOSES,
} from "@/lib/donations/constants";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set(
  DONATION_METHODS.map((item) => item.value)
);

const ALLOWED_PURPOSES = new Set(
  DONATION_PURPOSES.map((item) => item.value)
);

function text(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

function createReference() {
  const date = new Date();
  const compactDate = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");

  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `DON-${compactDate}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const slug = text(payload?.slug, 160);
    const donorName = text(payload?.donorName, 160);
    const donorEmail = text(payload?.donorEmail, 254).toLowerCase();
    const donorPhone = text(payload?.donorPhone, 80);
    const note = text(payload?.note, 1500);

    const amount = Number(payload?.amount);
    const currency = text(payload?.currency, 12).toUpperCase();
    const method = text(payload?.method, 40);
    const purpose = text(payload?.purpose, 40);
    const isAnonymous = Boolean(payload?.isAnonymous);

    if (!slug) {
      return NextResponse.json(
        { error: "Église introuvable." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    if (amount > 1_000_000_000) {
      return NextResponse.json(
        { error: "Le montant saisi est trop élevé." },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.has(method as any)) {
      return NextResponse.json(
        { error: "Mode de donation invalide." },
        { status: 400 }
      );
    }

    if (!ALLOWED_PURPOSES.has(purpose as any)) {
      return NextResponse.json(
        { error: "Affectation du don invalide." },
        { status: 400 }
      );
    }

    if (!isAnonymous && !donorName) {
      return NextResponse.json(
        { error: "Renseignez votre nom ou activez le don anonyme." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: church, error: churchError } = await admin
      .from("churches")
      .select(
        `
        id,
        name,
        public_name,
        slug,
        status,
        public_enabled,
        donation_enabled,
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
        donation_cash_enabled,
        donation_receipt_email
      `
      )
      .eq("slug", slug)
      .maybeSingle();

    if (
      churchError ||
      !church ||
      church.status !== "active" ||
      !church.public_enabled ||
      church.donation_enabled === false
    ) {
      return NextResponse.json(
        { error: "Les dons ne sont pas disponibles pour cette église." },
        { status: 404 }
      );
    }

    const allowedCurrencies = Array.isArray(
      church.donation_allowed_currencies
    )
      ? church.donation_allowed_currencies.map((item: string) =>
          String(item).toUpperCase()
        )
      : [church.donation_default_currency || "CDF"];

    if (!allowedCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: "Cette devise n’est pas autorisée." },
        { status: 400 }
      );
    }

    const minimumAmount = Number(church.donation_min_amount || 1);

    if (amount < minimumAmount) {
      return NextResponse.json(
        {
          error: `Le montant minimum est de ${minimumAmount} ${currency}.`,
        },
        { status: 400 }
      );
    }

    if (method === "card" && !church.donation_card_url) {
      return NextResponse.json(
        { error: "Le paiement par carte n’est pas encore configuré." },
        { status: 400 }
      );
    }

    if (method === "mobile_money" && !church.donation_mobile_money) {
      return NextResponse.json(
        { error: "Le Mobile Money n’est pas encore configuré." },
        { status: 400 }
      );
    }

    if (
      method === "bank_transfer" &&
      !church.donation_bank_account_number &&
      !church.donation_bank_iban
    ) {
      return NextResponse.json(
        { error: "Le virement bancaire n’est pas encore configuré." },
        { status: 400 }
      );
    }

    if (method === "cash" && church.donation_cash_enabled === false) {
      return NextResponse.json(
        { error: "Les dons en espèces ne sont pas activés." },
        { status: 400 }
      );
    }

    const reference = createReference();
    const publicToken = crypto.randomUUID();

    const status =
      method === "card" ? "awaiting_payment" : "submitted";

    const { data: donation, error: insertError } = await admin
      .from("church_donations")
      .insert({
        church_id: church.id,
        reference,
        public_token: publicToken,
        donor_name: isAnonymous ? null : donorName,
        donor_email: donorEmail || null,
        donor_phone: donorPhone || null,
        is_anonymous: isAnonymous,
        amount,
        currency,
        method,
        purpose,
        note: note || null,
        status,
        payment_provider:
          method === "card"
            ? church.donation_card_provider_name || "Paiement externe"
            : method === "mobile_money"
              ? church.donation_mobile_money_name || "Mobile Money"
              : method === "bank_transfer"
                ? church.donation_bank_name || "Banque"
                : "Espèces",
        external_payment_url:
          method === "card" ? church.donation_card_url : null,
        metadata: {
          source: "public_church_page",
          host: request.headers.get("host"),
          userAgent: request.headers.get("user-agent"),
        },
      })
      .select("reference, public_token, status")
      .single();

    if (insertError || !donation) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Impossible d’enregistrer cette intention de don.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        reference: donation.reference,
        publicToken: donation.public_token,
        status: donation.status,
        confirmationUrl: `/church/${slug}/don/success?reference=${encodeURIComponent(
          donation.reference
        )}&token=${encodeURIComponent(donation.public_token)}`,
        paymentUrl:
          method === "card" ? church.donation_card_url : null,
        instructions: {
          mobileMoney:
            method === "mobile_money"
              ? {
                  operator:
                    church.donation_mobile_money_name || "Mobile Money",
                  number: church.donation_mobile_money,
                }
              : null,
          bank:
            method === "bank_transfer"
              ? {
                  bankName: church.donation_bank_name,
                  accountName: church.donation_bank_account_name,
                  accountNumber: church.donation_bank_account_number,
                  iban: church.donation_bank_iban,
                  swift: church.donation_bank_swift,
                  details: church.donation_bank_details,
                }
              : null,
          receiptEmail: church.donation_receipt_email,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Une erreur inattendue a empêché l’enregistrement du don.",
      },
      { status: 500 }
    );
  }
}
