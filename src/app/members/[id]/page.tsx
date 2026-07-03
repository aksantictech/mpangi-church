import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ElementType } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Church,
  Edit,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Building2,
  BookOpenCheck,
  Camera,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

type MemberDetailsPageProps = {
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

function getMemberTypeLabel(type?: string | null) {
  if (type === "leader") return "Leader";
  if (type === "worker") return "Ouvrier";
  if (type === "new_convert") return "Nouveau converti";
  if (type === "visitor") return "Visiteur";
  if (type === "member") return "Membre";

  return type || "Membre";
}

export default async function MemberDetailsPage({
  params,
}: MemberDetailsPageProps) {
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
      *,
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

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/members"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux membres
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/15 text-white">
                  {member.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo_url}
                      alt={memberName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-11 w-11" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                    Fiche membre
                  </p>

                  <h1 className="mt-2 text-3xl font-extrabold">
                    {memberName}
                  </h1>

                  <p className="mt-2 text-sm text-blue-50">
                    {church?.name || "Église non renseignée"} •{" "}
                    {getMemberTypeLabel(member.member_type)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/members/${member.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>

<Link
  href={`/members/${member.id}/photo`}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
>
  <Camera className="h-4 w-4" />
  Photo
</Link>

<Link
  href={`/members/${member.id}/departments`}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
>
  <Building2 className="h-4 w-4" />
  Départements
</Link>

<Link
  href={`/members/${member.id}/trainings`}
  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
>
  <BookOpenCheck className="h-4 w-4" />
  Formations
</Link>

                <Link
                  href={`/members/${member.id}/qr`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              label="Statut"
              value={member.status || "-"}
              icon={ShieldCheck}
              badgeClass={getStatusClass(member.status)}
            />

            <InfoCard
              label="Type"
              value={getMemberTypeLabel(member.member_type)}
              icon={Users}
            />

            <InfoCard
              label="Église"
              value={church?.name || "-"}
              icon={Church}
            />

            <InfoCard
              label="Créé le"
              value={formatDate(member.created_at)}
              icon={CalendarDays}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Coordonnées
            </h2>

            <div className="mt-6 space-y-4">
              <DetailLine
                label="Téléphone"
                value={member.phone || "Non renseigné"}
                icon={Phone}
              />

              <DetailLine
                label="Email"
                value={member.email || "Non renseigné"}
                icon={Mail}
              />

              <DetailLine
                label="Adresse"
                value={member.address || "Non renseignée"}
                icon={MapPin}
              />

              <DetailLine
                label="Date de naissance"
                value={formatDate(member.birth_date)}
                icon={CalendarDays}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Informations complémentaires
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <MiniInfo label="Genre" value={member.gender || "-"} />
                <MiniInfo
                  label="État civil"
                  value={member.marital_status || "-"}
                />
                <MiniInfo
                  label="Profession"
                  value={member.profession || "-"}
                />
                <MiniInfo
                  label="Quartier / Commune"
                  value={member.city || member.commune || "-"}
                />
                <MiniInfo
                  label="Date d’intégration"
                  value={formatDate(member.joined_at || member.joined_date)}
                />
                <MiniInfo
                  label="Code membre"
                  value={member.member_code || member.qr_code || "-"}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-[#03357A]">Notes</h2>

              <p className="mt-5 whitespace-pre-line rounded-2xl bg-[#F8FBFD] p-5 text-sm leading-7 text-slate-600">
                {member.notes || "Aucune note enregistrée pour ce membre."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  badgeClass,
}: {
  label: string;
  value: string;
  icon: ElementType;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#3F79B3]" />

        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      {badgeClass ? (
        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-3 font-semibold text-slate-700">{value}</p>
      )}
    </div>
  );
}

function DetailLine({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F8FBFD] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-all font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-700">{value}</p>
    </div>
  );
}