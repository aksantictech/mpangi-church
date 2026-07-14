import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatDonationAmount,
  getDonationMethodLabel,
  getDonationPurposeLabel,
  getDonationStatusLabel,
} from "@/lib/donations/constants";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    reference?: string;
    token?: string;
  }>;
};

export default async function DonationSuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  if (!query.reference || !query.token) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: donation, error } = await admin
    .from("church_donations")
    .select(
      `
      reference,
      amount,
      currency,
      method,
      purpose,
      status,
      created_at,
      churches!inner (
        slug,
        name,
        public_name
      )
    `
    )
    .eq("reference", query.reference)
    .eq("public_token", query.token)
    .eq("churches.slug", slug)
    .maybeSingle();

  if (error || !donation) {
    notFound();
  }

  const churchData = Array.isArray(donation.churches)
    ? donation.churches[0]
    : donation.churches;

  const churchName =
    churchData?.public_name ||
    churchData?.name ||
    "Église";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F9FC] px-4 py-10">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#DCEAF5] bg-white p-5 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-5 text-3xl font-black text-[#03357A]">
          Merci pour votre générosité
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Votre intention de don à {churchName} a bien été
          enregistrée.
        </p>

        <div className="mt-6 grid gap-3 rounded-3xl bg-[#F8FBFD] p-5 text-left text-sm">
          <Info label="Référence" value={donation.reference} />
          <Info
            label="Montant"
            value={formatDonationAmount(
              donation.amount,
              donation.currency
            )}
          />
          <Info
            label="Affectation"
            value={getDonationPurposeLabel(donation.purpose)}
          />
          <Info
            label="Mode"
            value={getDonationMethodLabel(donation.method)}
          />
          <Info
            label="Statut"
            value={getDonationStatusLabel(donation.status)}
          />
        </div>

        <p className="mt-5 text-xs leading-6 text-slate-500">
          Conservez la référence afin de faciliter le suivi auprès de
          l’équipe financière de l’église.
        </p>

        <Link
          href={`/church/${slug}`}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-black text-white"
        >
          <Home className="h-4 w-4" />
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#DCEAF5] pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <strong className="break-words text-right text-[#03357A]">
        {value}
      </strong>
    </div>
  );
}
