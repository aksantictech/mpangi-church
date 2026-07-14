import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Settings,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { updateDonationStatusAction } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DONATION_STATUSES,
  formatDonationAmount,
  getDonationMethodLabel,
  getDonationPurposeLabel,
  getDonationStatusLabel,
} from "@/lib/donations/constants";

type PageProps = {
  searchParams: Promise<{
    status?: string;
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

export default async function FinanceDonationsPage({
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
    redirect("/unauthorized?reason=donations_access");
  }

  let donationsQuery = admin
    .from("church_donations")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false })
    .limit(300);

  if (
    query.status &&
    DONATION_STATUSES.some(
      (item) => item.value === query.status
    )
  ) {
    donationsQuery = donationsQuery.eq("status", query.status);
  }

  const { data: donations, error } = await donationsQuery;

  const rows = donations || [];
  const confirmed = rows.filter(
    (item) => item.status === "confirmed"
  );
  const pending = rows.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "awaiting_payment" ||
      item.status === "submitted"
  );

  const totalsByCurrency = confirmed.reduce(
    (acc: Record<string, number>, item) => {
      const currency = item.currency || "CDF";
      acc[currency] =
        (acc[currency] || 0) + Number(item.amount || 0);
      return acc;
    },
    {}
  );

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Volet finances
              </p>
              <h1 className="mt-2 text-3xl font-black">
                Dons reçus
              </h1>
              <p className="mt-3 text-sm leading-7 text-blue-50">
                Suivez les intentions de dons et confirmez les
                paiements réellement reçus.
              </p>
            </div>

            <Link
              href="/settings/donations"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#03357A]"
            >
              <Settings className="h-4 w-4" />
              Configurer
            </Link>
          </div>
        </header>

        {query.error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {query.error}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error.message}
          </div>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={Wallet}
            label="Intentions"
            value={String(rows.length)}
          />
          <Metric
            icon={Clock3}
            label="À vérifier"
            value={String(pending.length)}
          />
          <Metric
            icon={CheckCircle2}
            label="Confirmés"
            value={String(confirmed.length)}
          />
        </section>

        {Object.keys(totalsByCurrency).length > 0 && (
          <section className="mt-5 rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="font-black text-[#03357A]">
              Total confirmé par devise
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(totalsByCurrency).map(
                ([currency, amount]) => (
                  <span
                    key={currency}
                    className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700"
                  >
                    {formatDonationAmount(amount, currency)}
                  </span>
                )
              )}
            </div>
          </section>
        )}

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <Filter href="/finance/donations" label="Tous" />
          {DONATION_STATUSES.map((item) => (
            <Filter
              key={item.value}
              href={`/finance/donations?status=${item.value}`}
              label={item.label}
            />
          ))}
        </nav>

        <section className="mt-3 overflow-hidden rounded-[1.5rem] border border-[#DCEAF5] bg-white shadow-sm">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500">
              Aucun don correspondant à ce filtre.
            </div>
          ) : (
            <div className="divide-y divide-[#DCEAF5]">
              {rows.map((donation) => (
                <article
                  key={donation.id}
                  className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center sm:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                        {donation.reference}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {getDonationStatusLabel(donation.status)}
                      </span>
                    </div>

                    <h2 className="mt-3 break-words text-xl font-black text-[#03357A]">
                      {formatDonationAmount(
                        donation.amount,
                        donation.currency
                      )}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <span>
                        {getDonationPurposeLabel(donation.purpose)}
                      </span>
                      <span>
                        {getDonationMethodLabel(donation.method)}
                      </span>
                      <span>
                        {donation.is_anonymous
                          ? "Don anonyme"
                          : donation.donor_name || "Donateur non renseigné"}
                      </span>
                      <span>
                        {new Date(
                          donation.created_at
                        ).toLocaleString("fr-FR")}
                      </span>
                    </div>

                    {donation.note && (
                      <p className="mt-3 break-words text-sm leading-6 text-slate-500">
                        {donation.note}
                      </p>
                    )}
                  </div>

                  <form
                    action={updateDonationStatusAction}
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <input
                      type="hidden"
                      name="donation_id"
                      value={donation.id}
                    />

                    <select
                      name="status"
                      defaultValue={donation.status}
                      className="min-h-11 rounded-xl border border-[#DCEAF5] bg-[#F8FBFD] px-3 text-sm font-bold text-[#03357A]"
                    >
                      {DONATION_STATUSES.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="min-h-11 rounded-xl bg-[#03357A] px-4 text-sm font-black text-white"
                    >
                      Mettre à jour
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#DCEAF5] bg-white p-4 shadow-sm">
      <Icon className="h-6 w-6 text-[#03357A]" />
      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-[#03357A]">
        {value}
      </p>
    </div>
  );
}

function Filter({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-black text-[#03357A] shadow-sm ring-1 ring-[#DCEAF5]"
    >
      {label}
    </Link>
  );
}
