import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  HeartHandshake,
  Phone,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createClient } from "@/lib/supabase/server";

type SoulFollowupDetailsPageProps = {
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

function getStatusClass(status?: string | null) {
  if (status === "nouveau") return "bg-purple-50 text-purple-700";
  if (status === "en_cours") return "bg-blue-50 text-blue-700";
  if (status === "integre") return "bg-green-50 text-green-700";
  if (status === "cloture") return "bg-slate-100 text-slate-600";

  return "bg-slate-100 text-slate-600";
}

function getPriorityClass(priority?: string | null) {
  if (priority === "haute") return "bg-red-50 text-red-700";
  if (priority === "normale") return "bg-blue-50 text-blue-700";
  if (priority === "faible") return "bg-slate-100 text-slate-600";

  return "bg-slate-100 text-slate-600";
}

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

function getSoulName(followup: any) {
  if (followup.full_name) return followup.full_name;

  const member = firstItem<any>(followup.members);

  if (member) {
    return getMemberName(member) || "Nom non renseigné";
  }

  return "Nom non renseigné";
}

export default async function SoulFollowupDetailsPage({
  params,
}: SoulFollowupDetailsPageProps) {
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

  const { data: followupRaw } = await supabase
    .from("soul_followups")
    .select(
      `
      id,
      church_id,
      member_id,
      full_name,
      phone,
      source,
      need_type,
      priority,
      status,
      first_contact_date,
      last_contact_date,
      next_followup_date,
      notes,
      source_request_type,
      source_request_id,
      created_at,
      members(id, first_name, middle_name, last_name, phone, photo_url, status)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!followupRaw) {
    notFound();
  }

  const followup = followupRaw as any;

  if (followup.church_id !== profile.church_id) {
    notFound();
  }

  const member = firstItem<any>(followup.members);
  const soulName = getSoulName(followup);
  const phone = followup.phone || member?.phone || "-";

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/souls"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au suivi des âmes
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white/15">
                  {member?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photo_url}
                      alt={soulName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <HeartHandshake className="h-8 w-8" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                    Fiche suivi pastoral
                  </p>

                  <h1 className="mt-2 text-3xl font-extrabold">
                    {soulName}
                  </h1>

                  <p className="mt-2 text-sm text-blue-50">
                    {followup.need_type || "Besoin non renseigné"} •{" "}
                    {followup.source || "Source non renseignée"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {member?.id && (
                  <Link
                    href={`/members/${member.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20"
                  >
                    <Users className="h-4 w-4" />
                    Voir membre
                  </Link>
                )}

                <Link
                  href={`/souls/${followup.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Statut"
              value={followup.status || "nouveau"}
              description="État du suivi"
              icon={ShieldCheck}
              accent={followup.status === "integre" ? "green" : "blue"}
            />

            <MetricCard
              title="Priorité"
              value={followup.priority || "normale"}
              description="Niveau d’urgence"
              icon={HeartHandshake}
              accent={followup.priority === "haute" ? "purple" : "blue"}
            />

            <MetricCard
              title="Dernier contact"
              value={formatDate(followup.last_contact_date)}
              description="Dernière interaction"
              icon={CalendarDays}
              accent="purple"
            />

            <MetricCard
              title="Prochain suivi"
              value={formatDate(followup.next_followup_date)}
              description="Date programmée"
              icon={CalendarDays}
              accent="green"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Informations principales
            </h2>

            <div className="mt-6 space-y-4">
              <InfoLine label="Nom complet" value={soulName} />

              <InfoLine
                label="Téléphone"
                value={phone}
                icon={<Phone className="h-4 w-4 text-[#3F79B3]" />}
              />

              <InfoLine
                label="Source"
                value={followup.source || "Non renseignée"}
              />

              <InfoLine
                label="Besoin"
                value={followup.need_type || "Non renseigné"}
              />

              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Priorité
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(
                    followup.priority
                  )}`}
                >
                  {followup.priority || "normale"}
                </span>
              </div>

              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Statut
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                    followup.status
                  )}`}
                >
                  {followup.status || "nouveau"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Notes pastorales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contexte, besoin exprimé, recommandations et évolution du suivi.
            </p>

            <div className="mt-6 rounded-2xl bg-[#F8FBFD] p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {followup.notes || "Aucune note enregistrée."}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <DateBox
                label="Premier contact"
                value={formatDate(followup.first_contact_date)}
              />

              <DateBox
                label="Dernier contact"
                value={formatDate(followup.last_contact_date)}
              />

              <DateBox
                label="Prochain suivi"
                value={formatDate(followup.next_followup_date)}
              />
            </div>

            {member && (
              <div className="mt-5 rounded-2xl border border-[#DCEAF5] bg-white p-5">
                <h3 className="font-extrabold text-[#03357A]">
                  Membre associé
                </h3>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-[#03357A]">
                    {member.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo_url}
                        alt={soulName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <p className="font-extrabold text-[#03357A]">
                      {getMemberName(member) || "Nom non renseigné"}
                    </p>

                    <p className="text-sm text-slate-500">
                      Statut : {member.status || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {icon}
        <p className="font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-700">{value}</p>
    </div>
  );
}