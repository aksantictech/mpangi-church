import {
  NextRequest,
  NextResponse,
} from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DONATION_PAYMENT_CHANNELS,
  DONATION_PURPOSES,
} from "@/lib/donations/constants";

export const dynamic = "force-dynamic";

const ALLOWED_CHANNELS = new Set(
  DONATION_PAYMENT_CHANNELS.map(
    (item) => item.value
  )
);

const ALLOWED_PURPOSES = new Set(
  DONATION_PURPOSES.map(
    (item) => item.value
  )
);

function text(
  value: unknown,
  maxLength: number
) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function createReference() {
  const date = new Date();

  const compactDate = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(
      2,
      "0"
    ),
    String(date.getUTCDate()).padStart(
      2,
      "0"
    ),
  ].join("");

  const random = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `DON-${compactDate}-${random}`;
}

function getMethodFromChannel(
  channel: string
) {
  if (
    channel === "mpesa" ||
    channel === "airtel_money" ||
    channel === "orange_money"
  ) {
    return "mobile_money";
  }

  if (channel === "card") {
    return "card";
  }

  if (channel === "bank_transfer") {
    return "bank_transfer";
  }

  return "cash";
}

function isTenantHostname(
  hostname: string
) {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    "mpangi-church.app";

  const normalized = hostname
    .split(":")[0]
    .toLowerCase();

  return (
    normalized.endsWith(`.${rootDomain}`) &&
    normalized !== `www.${rootDomain}`
  );
}

function createConfirmationPath(
  request: NextRequest,
  slug: string,
  reference: string,
  token: string
) {
  const hostname =
    request.headers.get("host") || "";

  const basePath = isTenantHostname(
    hostname
  )
    ? "/don/success"
    : `/church/${slug}/don/success`;

  return `${basePath}?reference=${encodeURIComponent(
    reference
  )}&token=${encodeURIComponent(token)}`;
}

function buildPaymentUrl({
  rawUrl,
  amount,
  currency,
  reference,
  returnUrl,
}: {
  rawUrl: string;
  amount: number;
  currency: string;
  reference: string;
  returnUrl: string;
}) {
  return rawUrl
    .replaceAll(
      "{amount}",
      encodeURIComponent(String(amount))
    )
    .replaceAll(
      "{currency}",
      encodeURIComponent(currency)
    )
    .replaceAll(
      "{reference}",
      encodeURIComponent(reference)
    )
    .replaceAll(
      "{return_url}",
      encodeURIComponent(returnUrl)
    );
}

export async function POST(
  request: NextRequest
) {
  try {
    const payload = await request.json();

    const slug = text(
      payload?.slug,
      160
    );

    const donorName = text(
      payload?.donorName,
      160
    );

    const donorEmail = text(
      payload?.donorEmail,
      254
    ).toLowerCase();

    const donorPhone = text(
      payload?.donorPhone,
      80
    );

    const note = text(
      payload?.note,
      1500
    );

    const amount = Number(payload?.amount);

    const currency = text(
      payload?.currency,
      12
    ).toUpperCase();

    const channel = text(
      payload?.channel,
      40
    );

    const purpose = text(
      payload?.purpose,
      40
    );

    const isAnonymous = Boolean(
      payload?.isAnonymous
    );

    if (!slug) {
      return NextResponse.json(
        { error: "Église introuvable." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Le montant doit être supérieur à zéro.",
        },
        { status: 400 }
      );
    }

    if (amount > 1_000_000_000) {
      return NextResponse.json(
        {
          error:
            "Le montant saisi est trop élevé.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_CHANNELS.has(channel as any)) {
      return NextResponse.json(
        {
          error:
            "Moyen de paiement invalide.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_PURPOSES.has(purpose as any)) {
      return NextResponse.json(
        {
          error:
            "Affectation du don invalide.",
        },
        { status: 400 }
      );
    }

    if (!isAnonymous && !donorName) {
      return NextResponse.json(
        {
          error:
            "Renseignez votre nom ou activez le don anonyme.",
        },
        { status: 400 }
      );
    }

    const method =
      getMethodFromChannel(channel);

    if (
      method === "mobile_money" &&
      !donorPhone
    ) {
      return NextResponse.json(
        {
          error:
            "Le téléphone du donateur est requis pour Mobile Money.",
        },
        { status: 400 }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: church,
      error: churchError,
    } = await admin
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

        donation_mpesa_enabled,
        donation_mpesa_number,
        donation_mpesa_name,

        donation_airtel_enabled,
        donation_airtel_number,
        donation_airtel_name,

        donation_orange_enabled,
        donation_orange_number,
        donation_orange_name,

        donation_card_enabled,
        donation_card_url,
        donation_card_provider_name,

        donation_bank_enabled,
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
        {
          error:
            "Les dons ne sont pas disponibles pour cette église.",
        },
        { status: 404 }
      );
    }

    const allowedCurrencies =
      Array.isArray(
        church.donation_allowed_currencies
      )
        ? church.donation_allowed_currencies.map(
            (item: string) =>
              String(item).toUpperCase()
          )
        : [
            church.donation_default_currency ||
              "CDF",
          ];

    if (
      !allowedCurrencies.includes(currency)
    ) {
      return NextResponse.json(
        {
          error:
            "Cette devise n’est pas autorisée.",
        },
        { status: 400 }
      );
    }

    const minimumAmount = Number(
      church.donation_min_amount || 1
    );

    if (amount < minimumAmount) {
      return NextResponse.json(
        {
          error: `Le montant minimum est de ${minimumAmount} ${currency}.`,
        },
        { status: 400 }
      );
    }

    const mobileConfig = {
      mpesa: {
        enabled:
          church.donation_mpesa_enabled,
        number:
          church.donation_mpesa_number,
        operator: "M-Pesa",
        accountName:
          church.donation_mpesa_name,
      },
      airtel_money: {
        enabled:
          church.donation_airtel_enabled,
        number:
          church.donation_airtel_number,
        operator: "Airtel Money",
        accountName:
          church.donation_airtel_name,
      },
      orange_money: {
        enabled:
          church.donation_orange_enabled,
        number:
          church.donation_orange_number,
        operator: "Orange Money",
        accountName:
          church.donation_orange_name,
      },
    } as const;

    const selectedMobile =
      channel in mobileConfig
        ? mobileConfig[
            channel as keyof typeof mobileConfig
          ]
        : null;

    if (
      method === "mobile_money" &&
      (
        !selectedMobile?.enabled ||
        !selectedMobile.number
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ce canal Mobile Money n’est pas configuré.",
        },
        { status: 400 }
      );
    }

    if (
      channel === "card" &&
      (
        !church.donation_card_enabled ||
        !church.donation_card_url
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Le paiement par carte n’est pas encore configuré.",
        },
        { status: 400 }
      );
    }

    if (
      channel === "bank_transfer" &&
      (
        !church.donation_bank_enabled ||
        (
          !church.donation_bank_account_number &&
          !church.donation_bank_iban
        )
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Le virement bancaire n’est pas encore configuré.",
        },
        { status: 400 }
      );
    }

    if (
      channel === "cash" &&
      church.donation_cash_enabled === false
    ) {
      return NextResponse.json(
        {
          error:
            "Les dons en espèces ne sont pas activés.",
        },
        { status: 400 }
      );
    }

    const reference =
      createReference();

    const publicToken =
      crypto.randomUUID();

    const confirmationPath =
      createConfirmationPath(
        request,
        slug,
        reference,
        publicToken
      );

    const absoluteConfirmationUrl =
      new URL(
        confirmationPath,
        request.url
      ).toString();

    const paymentProvider =
      selectedMobile?.operator ||
      (
        channel === "card"
          ? church.donation_card_provider_name ||
            "Paiement externe"
          : channel === "bank_transfer"
            ? church.donation_bank_name ||
              "Banque"
            : "Espèces"
      );

    const instructionSnapshot = {
      channel,
      mobileMoney: selectedMobile
        ? {
            operator:
              selectedMobile.operator,
            number:
              selectedMobile.number,
            accountName:
              selectedMobile.accountName,
          }
        : null,
      bank:
        channel === "bank_transfer"
          ? {
              bankName:
                church.donation_bank_name,
              accountName:
                church.donation_bank_account_name,
              accountNumber:
                church.donation_bank_account_number,
              iban:
                church.donation_bank_iban,
              swift:
                church.donation_bank_swift,
              details:
                church.donation_bank_details,
            }
          : null,
    };

    const status =
      channel === "cash"
        ? "submitted"
        : "awaiting_payment";

    const {
      data: donation,
      error: insertError,
    } = await admin
      .from("church_donations")
      .insert({
        church_id: church.id,
        reference,
        public_token: publicToken,

        donor_name: isAnonymous
          ? null
          : donorName,
        donor_email:
          donorEmail || null,
        donor_phone:
          donorPhone || null,
        is_anonymous: isAnonymous,

        amount,
        currency,
        method,
        payment_channel: channel,
        purpose,
        note: note || null,
        status,

        payment_provider:
          paymentProvider,

        external_payment_url:
          channel === "card"
            ? church.donation_card_url
            : null,

        payment_instructions_snapshot:
          instructionSnapshot,

        metadata: {
          source:
            "public_church_page",
          host:
            request.headers.get("host"),
          userAgent:
            request.headers.get(
              "user-agent"
            ),
        },
      })
      .select(
        "reference, public_token, status"
      )
      .single();

    if (
      insertError ||
      !donation
    ) {
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Impossible d’enregistrer ce don.",
        },
        { status: 500 }
      );
    }

    const paymentUrl =
      channel === "card" &&
      church.donation_card_url
        ? buildPaymentUrl({
            rawUrl:
              church.donation_card_url,
            amount,
            currency,
            reference,
            returnUrl:
              absoluteConfirmationUrl,
          })
        : null;

    return NextResponse.json({
      data: {
        reference:
          donation.reference,
        publicToken:
          donation.public_token,
        status:
          donation.status,
        confirmationUrl:
          confirmationPath,
        paymentUrl,
        instructions: {
          mobileMoney:
            selectedMobile
              ? {
                  operator:
                    selectedMobile.operator,
                  number:
                    selectedMobile.number,
                  accountName:
                    selectedMobile.accountName,
                }
              : null,

          bank:
            channel === "bank_transfer"
              ? {
                  bankName:
                    church.donation_bank_name,
                  accountName:
                    church.donation_bank_account_name,
                  accountNumber:
                    church.donation_bank_account_number,
                  iban:
                    church.donation_bank_iban,
                  swift:
                    church.donation_bank_swift,
                  details:
                    church.donation_bank_details,
                }
              : null,

          receiptEmail:
            church.donation_receipt_email,
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
