import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Church,
  Phone,
  QrCode,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberQrCodeCard from "@/components/members/MemberQrCodeCard";
import { createClient } from "@/lib/supabase/server";

type MemberQrPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function getStatusClass(status?: string | null) {
  if (status === "actif") return "bg-green-50 text-green-700";
  if (status === "inactif") return "bg-red-50 text-red-700";
  if (status === "suspendu") return "bg-orange-50 text-orange-700";

  return "bg-slate-100 text-slate-600";
}

export default async function MemberQrPage({ params }: MemberQrPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect("/super-admin/dashboard");
  }

  if (!profile.church_id) {
    redirect("/login");
  }

  const { data: memberRaw } = await supabase
    .from("members")
    .select(
      `
      id,
      church_id,
      first_name,
      middle_name,
      last_name,
      phone,
      photo_url,
      member_type,
      status,
      created_at,
      churches(id, name, slug)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!memberRaw) {
    notFound();
  }

  const member = memberRaw as any;

  if (member.church_id !== profile.church_id) {
    notFound();
  }

  const church = firstItem<any>(member.churches);
  const memberName = getMemberName(member) || "Nom non renseigné";

  const qrPayload = JSON.stringify({
    type: "mpangi_church_member",
    member_id: member.id,
    church_id: member.church_id,
    church_slug: church?.slug || null,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/members/${member.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la fiche membre
        </Link>

        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                <QrCode className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                  QR Code sécurisé
                </p>

                <h1 className="mt-2 text-3xl font-extrabold">
                  {memberName}
                </h1>

                <p className="mt-2 text-sm text-blue-50">
                  {church?.name || "Église non renseignée"} • QR Code membre
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Informations membre
              </h2>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#EAF3FA] text-[#03357A]">
                  {member.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo_url}
                      alt={memberName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-10 w-10" />
                  )}
                </div>

                <div>
                  <p className="text-lg font-extrabold text-[#03357A]">
                    {memberName}
                  </p>

                  <p className="text-sm text-slate-500">
                    {member.member_type || "member"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <InfoLine
                  icon={Phone}
                  label="Téléphone"
                  value={member.phone || "Non renseigné"}
                />

                <InfoLine
                  icon={ShieldCheck}
                  label="Statut"
                  value={member.status || "-"}
                  badgeClass={getStatusClass(member.status)}
                />

                <InfoLine
                  icon={CalendarDays}
                  label="Créé le"
                  value={formatDate(member.created_at)}
                />

                <InfoLine
                  icon={Church}
                  label="Église"
                  value={church?.name || "-"}
                />
              </div>
            </div>
          </div>

          <MemberQrCodeCard
            memberId={member.id}
            memberName={memberName}
            churchName={church?.name || "Église non renseignée"}
            qrValue={qrPayload}
          />
        </section>
      </div>
    </AppShell>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  badgeClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FBFD] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
          <Icon className="h-5 w-5" />
        </div>

        <p className="text-sm font-bold text-slate-500">{label}</p>
      </div>

      {badgeClass ? (
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="text-right text-sm font-extrabold text-[#03357A]">
          {value}
        </p>
      )}
    </div>
  );
}