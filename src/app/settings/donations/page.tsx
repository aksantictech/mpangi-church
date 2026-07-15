import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BookOpen,
  Building2,
  CreditCard,
  Save,
  Settings2,
  Smartphone,
} from "lucide-react";
import { redirect } from "next/navigation";
import { updateDonationSettingsAction } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

const ALLOWED_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
  "pasteur_t",
  "pastor",
  "charge_afp",
]);

const DEFAULT_VERSE =
  "Honore l’Éternel avec tes biens, et avec les prémices de tout ton revenu : alors tes greniers seront remplis d’abondance.";

export default async function DonationSettingsPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?reason=auth_required"
    );
  }

  const admin =
    createAdminClient();

  const { data: profile } =
    await admin
      .from("profiles")
      .select("role, church_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    !profile ||
    !profile.church_id ||
    !ALLOWED_ROLES.has(
      String(profile.role)
    )
  ) {
    redirect(
      "/unauthorized?reason=donation_settings"
    );
  }

  const { data: church } =
    await admin
      .from("churches")
      .select(
        `
        name,
        donation_enabled,
        donation_message,
        donation_bible_verse_text,
        donation_bible_verse_reference,
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
      .eq("id", profile.church_id)
      .maybeSingle();

  if (!church) {
    redirect(
      "/settings?error=church_missing"
    );
  }

  const allowedCurrencies =
    Array.isArray(
      church.donation_allowed_currencies
    )
      ? church.donation_allowed_currencies.join(
          ", "
        )
      : "CDF, USD, EUR";

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>

        <header className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <Settings2 className="h-8 w-8" />

          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            Paramètres église
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Configuration des dons
          </h1>

          <p className="mt-3 text-sm leading-7 text-blue-50">
            Configurez les moyens de paiement réellement proposés
            par {church.name}.
          </p>
        </header>

        {query.saved === "1" && (
          <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
            Configuration enregistrée.
          </div>
        )}

        {query.error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {query.error}
          </div>
        )}

        <form
          action={updateDonationSettingsAction}
          className="mt-5 space-y-5"
        >
          <Card
            title="Activation et message"
            icon={Settings2}
          >
            <Checkbox
              name="donation_enabled"
              label="Activer la page publique de dons"
              defaultChecked={
                church.donation_enabled !== false
              }
            />

            <Field
              label="Message d’accueil"
              name="donation_message"
              defaultValue={
                church.donation_message
              }
              textarea
              placeholder="Votre générosité soutient la mission..."
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Devise par défaut"
                name="default_currency"
                defaultValue={
                  church.donation_default_currency ||
                  "CDF"
                }
              />

              <Field
                label="Devises autorisées"
                name="allowed_currencies"
                defaultValue={
                  allowedCurrencies
                }
                hint="Séparez par des virgules : CDF, USD, EUR."
              />

              <Field
                label="Montant minimum"
                name="donation_min_amount"
                type="number"
                defaultValue={String(
                  church.donation_min_amount ||
                    1
                )}
              />
            </div>
          </Card>

          <Card
            title="Verset biblique"
            icon={BookOpen}
          >
            <Field
              label="Texte du verset"
              name="donation_bible_verse_text"
              defaultValue={
                church.donation_bible_verse_text ||
                DEFAULT_VERSE
              }
              textarea
            />

            <Field
              label="Référence"
              name="donation_bible_verse_reference"
              defaultValue={
                church.donation_bible_verse_reference ||
                "Proverbes 3:9-10"
              }
            />
          </Card>

          <Card
            title="M-Pesa"
            icon={Smartphone}
          >
            <Checkbox
              name="donation_mpesa_enabled"
              label="Activer M-Pesa"
              defaultChecked={Boolean(
                church.donation_mpesa_enabled
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Numéro officiel / marchand"
                name="donation_mpesa_number"
                defaultValue={
                  church.donation_mpesa_number
                }
                placeholder="+243..."
              />

              <Field
                label="Nom du titulaire"
                name="donation_mpesa_name"
                defaultValue={
                  church.donation_mpesa_name
                }
              />
            </div>
          </Card>

          <Card
            title="Airtel Money"
            icon={Smartphone}
          >
            <Checkbox
              name="donation_airtel_enabled"
              label="Activer Airtel Money"
              defaultChecked={Boolean(
                church.donation_airtel_enabled
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Numéro officiel / marchand"
                name="donation_airtel_number"
                defaultValue={
                  church.donation_airtel_number
                }
                placeholder="+243..."
              />

              <Field
                label="Nom du titulaire"
                name="donation_airtel_name"
                defaultValue={
                  church.donation_airtel_name
                }
              />
            </div>
          </Card>

          <Card
            title="Orange Money"
            icon={Smartphone}
          >
            <Checkbox
              name="donation_orange_enabled"
              label="Activer Orange Money"
              defaultChecked={Boolean(
                church.donation_orange_enabled
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Numéro officiel / marchand"
                name="donation_orange_number"
                defaultValue={
                  church.donation_orange_number
                }
                placeholder="+243..."
              />

              <Field
                label="Nom du titulaire"
                name="donation_orange_name"
                defaultValue={
                  church.donation_orange_name
                }
              />
            </div>
          </Card>

          <Card
            title="Carte bancaire"
            icon={CreditCard}
          >
            <Checkbox
              name="donation_card_enabled"
              label="Activer le paiement par carte"
              defaultChecked={Boolean(
                church.donation_card_enabled
              )}
            />

            <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-800">
              Ne renseignez jamais une carte bancaire personnelle.
              Ajoutez uniquement le lien HTTPS fourni par votre
              prestataire de paiement ou son environnement de test.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prestataire"
                name="donation_card_provider_name"
                defaultValue={
                  church.donation_card_provider_name
                }
                placeholder="CinetPay, banque, autre..."
              />

              <Field
                label="Lien de paiement sécurisé"
                name="donation_card_url"
                type="url"
                defaultValue={
                  church.donation_card_url
                }
                placeholder="https://..."
                hint="Variables facultatives : {amount}, {currency}, {reference}, {return_url}."
              />
            </div>
          </Card>

          <Card
            title="Virement bancaire"
            icon={Building2}
          >
            <Checkbox
              name="donation_bank_enabled"
              label="Activer le virement bancaire"
              defaultChecked={Boolean(
                church.donation_bank_enabled
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Banque"
                name="donation_bank_name"
                defaultValue={
                  church.donation_bank_name
                }
              />

              <Field
                label="Titulaire du compte"
                name="donation_bank_account_name"
                defaultValue={
                  church.donation_bank_account_name
                }
              />

              <Field
                label="Numéro de compte"
                name="donation_bank_account_number"
                defaultValue={
                  church.donation_bank_account_number
                }
              />

              <Field
                label="IBAN"
                name="donation_bank_iban"
                defaultValue={
                  church.donation_bank_iban
                }
              />

              <Field
                label="SWIFT / BIC"
                name="donation_bank_swift"
                defaultValue={
                  church.donation_bank_swift
                }
              />

              <Field
                label="Email de suivi financier"
                name="donation_receipt_email"
                type="email"
                defaultValue={
                  church.donation_receipt_email
                }
              />
            </div>

            <Field
              label="Instructions complémentaires"
              name="donation_bank_details"
              defaultValue={
                church.donation_bank_details
              }
              textarea
            />
          </Card>

          <Card
            title="Espèces"
            icon={Banknote}
          >
            <Checkbox
              name="donation_cash_enabled"
              label="Autoriser la déclaration de dons en espèces"
              defaultChecked={
                church.donation_cash_enabled !==
                false
              }
            />
          </Card>

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-4 text-sm font-black text-white sm:w-auto"
          >
            <Save className="h-5 w-5" />
            Enregistrer la configuration
          </button>
        </form>
      </div>
    </main>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Settings2;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-5 w-5" />
        </div>

        <h2 className="text-xl font-black text-[#03357A]">
          {title}
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black text-[#03357A]">
        {label}
      </span>

      {textarea ? (
        <textarea
          name={name}
          rows={4}
          defaultValue={
            defaultValue || ""
          }
          placeholder={placeholder}
          className="mpangi-form-control min-h-28 py-3"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={
            defaultValue || ""
          }
          placeholder={placeholder}
          className="mpangi-form-control"
        />
      )}

      {hint && (
        <span className="block text-xs font-semibold leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-4">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-[#C9DBEA]"
      />

      <span className="text-sm font-black text-slate-700">
        {label}
      </span>
    </label>
  );
}
