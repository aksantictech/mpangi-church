import Link from "next/link";
import { ArrowLeft, Save, Settings2 } from "lucide-react";
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

export default async function DonationSettingsPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth_required");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !profile.church_id ||
    !ALLOWED_ROLES.has(String(profile.role))
  ) {
    redirect("/unauthorized?reason=donation_settings");
  }

  const { data: church } = await admin
    .from("churches")
    .select(
      `
      name,
      donation_enabled,
      donation_message,
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
    .eq("id", profile.church_id)
    .maybeSingle();

  if (!church) {
    redirect("/settings?error=church_missing");
  }

  const allowedCurrencies = Array.isArray(
    church.donation_allowed_currencies
  )
    ? church.donation_allowed_currencies.join(", ")
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
            Configurez les moyens de donation proposés par{" "}
            {church.name}.
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
          <Card title="Activation et message">
            <Checkbox
              name="donation_enabled"
              label="Activer la page publique de dons"
              defaultChecked={church.donation_enabled !== false}
            />

            <Field
              label="Message public"
              name="donation_message"
              defaultValue={church.donation_message}
              textarea
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Devise par défaut"
                name="default_currency"
                defaultValue={
                  church.donation_default_currency || "CDF"
                }
              />
              <Field
                label="Devises autorisées"
                name="allowed_currencies"
                defaultValue={allowedCurrencies}
                hint="Séparez par des virgules."
              />
              <Field
                label="Montant minimum"
                name="donation_min_amount"
                type="number"
                defaultValue={String(
                  church.donation_min_amount || 1
                )}
              />
            </div>
          </Card>

          <Card title="Mobile Money">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Opérateur / libellé"
                name="donation_mobile_money_name"
                defaultValue={church.donation_mobile_money_name}
                placeholder="M-Pesa, Airtel Money…"
              />
              <Field
                label="Numéro Mobile Money"
                name="donation_mobile_money"
                defaultValue={church.donation_mobile_money}
              />
            </div>
          </Card>

          <Card title="Carte bancaire">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prestataire"
                name="donation_card_provider_name"
                defaultValue={church.donation_card_provider_name}
                placeholder="Stripe, PayPal, lien bancaire…"
              />
              <Field
                label="Lien de paiement sécurisé"
                name="donation_card_url"
                type="url"
                defaultValue={church.donation_card_url}
              />
            </div>
          </Card>

          <Card title="Virement bancaire">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Banque"
                name="donation_bank_name"
                defaultValue={church.donation_bank_name}
              />
              <Field
                label="Titulaire du compte"
                name="donation_bank_account_name"
                defaultValue={church.donation_bank_account_name}
              />
              <Field
                label="Numéro de compte"
                name="donation_bank_account_number"
                defaultValue={church.donation_bank_account_number}
              />
              <Field
                label="IBAN"
                name="donation_bank_iban"
                defaultValue={church.donation_bank_iban}
              />
              <Field
                label="SWIFT"
                name="donation_bank_swift"
                defaultValue={church.donation_bank_swift}
              />
              <Field
                label="Email de suivi financier"
                name="donation_receipt_email"
                type="email"
                defaultValue={church.donation_receipt_email}
              />
            </div>

            <Field
              label="Instructions complémentaires"
              name="donation_bank_details"
              defaultValue={church.donation_bank_details}
              textarea
            />
          </Card>

          <Card title="Espèces">
            <Checkbox
              name="donation_cash_enabled"
              label="Autoriser la déclaration de dons en espèces"
              defaultChecked={church.donation_cash_enabled !== false}
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-[#03357A]">
        {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
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
          defaultValue={defaultValue || ""}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 py-3 outline-none focus:border-[#03357A]"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue || ""}
          placeholder={placeholder}
          className="min-h-12 w-full rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] px-4 outline-none focus:border-[#03357A]"
        />
      )}

      {hint && (
        <span className="text-xs text-slate-500">{hint}</span>
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
    <label className="flex items-center gap-3 rounded-2xl bg-[#F8FBFD] p-4">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded"
      />
      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>
    </label>
  );
}
