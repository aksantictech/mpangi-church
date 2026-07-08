import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Church,
  ExternalLink,
  HeartHandshake,
  MapPin,
  Pencil,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import MetricCard from "@/components/dashboard/MetricCard";
import SuperAdminUserActions from "@/components/super-admin/SuperAdminUserActions";
import { createClient } from "@/lib/supabase/server";

type ChurchDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusClass(status: string) {
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "archived") return "bg-slate-100 text-slate-600";
  if (status === "inactive") return "bg-orange-50 text-orange-700";
  if (status === "suspended") return "bg-red-50 text-red-700";

  return "bg-slate-100 text-slate-600";
}

export default async function ChurchDetailsPage({
  params,
}: ChurchDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: church } = await supabase
    .from("churches")
    .select(
      `
      id,
      name,
      slug,
      logo_url,
      address,
      city,
      country,
      phone,
      whatsapp,
      email,
      service_times,
      status,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!church) {
    notFound();
  }

  const [
    { count: membersCount },
    { count: eventsCount },
    { count: attendancesCount },
    { count: followupsCount },
    { data: churchUsers },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", church.id),

    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("church_id", church.id),

    supabase
      .from("attendances")
      .select("*", { count: "exact", head: true })
      .eq("church_id", church.id),

    supabase
      .from("soul_followups")
      .select("*", { count: "exact", head: true })
      .eq("church_id", church.id),

    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, status, created_at")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false }),
  ]);

  const location = [church.address, church.city, church.country]
    .filter(Boolean)
    .join(", ");

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/super-admin/churches"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux églises
            </Link>

            <h1 className="mt-3 text-3xl font-extrabold text-[#03357A]">
              {church.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Détails, utilisateurs et aperçu de l’espace église.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/super-admin/churches/${church.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-5 py-3 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>

            <Link
              href={`/super-admin/churches/${church.id}/users/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </Link>

            <Link
              href={`/church/${church.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20"
            >
              Page publique
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="relative h-64 bg-gradient-to-br from-[#03357A] via-[#3F79B3] to-[#8B5CF6]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#03357A]/80 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/50 bg-white text-[#03357A] shadow-sm">
                  {church.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={church.logo_url}
                      alt={`Logo ${church.name}`}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Church className="h-10 w-10" />
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-extrabold text-white">
                    {church.name}
                  </h2>

                  <p className="mt-1 text-sm text-blue-100">
                    /church/{church.slug}
                  </p>
                </div>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                  church.status
                )}`}
              >
                {church.status}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <MapPin className="h-5 w-5 text-[#3F79B3]" />

              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Adresse
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {location || "Non renseignée"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <Phone className="h-5 w-5 text-[#3F79B3]" />

              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Téléphone
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {church.phone || church.whatsapp || "Non renseigné"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                {church.email || "Non renseigné"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FBFD] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Créée le
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {church.created_at
                  ? new Intl.DateTimeFormat("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(church.created_at))
                  : "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FBFD] p-4 md:col-span-2 xl:col-span-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Horaires / Programmes
              </p>

              <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-700">
                {church.service_times || "Non renseignés"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Membres"
            value={membersCount ?? 0}
            description="Inscrits dans cette église"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Événements"
            value={eventsCount ?? 0}
            description="Cultes et réunions"
            icon={Church}
            accent="blue"
          />

          <MetricCard
            title="Présences"
            value={attendancesCount ?? 0}
            description="Pointages enregistrés"
            icon={CalendarCheck}
            accent="green"
          />

          <MetricCard
            title="Âmes suivies"
            value={followupsCount ?? 0}
            description="Suivi pastoral"
            icon={HeartHandshake}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Utilisateurs de cette église
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Gérez les comptes liés à cette église : rôle, statut et mot de
                passe.
              </p>
            </div>

            <Link
              href={`/super-admin/churches/${church.id}/users/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20"
            >
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {churchUsers?.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun utilisateur lié à cette église.
                    </td>
                  </tr>
                )}

                {churchUsers?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-[#F8FBFD]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] font-bold text-[#03357A]">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || "Utilisateur"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (user.full_name || "U").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {user.full_name || "Nom non renseigné"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {user.email || "Email non renseigné"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-bold text-[#03357A]">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          user.status === "inactive"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {user.status || "active"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <SuperAdminUserActions
                        profileId={user.id}
                        currentRole={user.role}
                        currentStatus={user.status || "active"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Prochaines actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configurez cette église et créez son compte d’accès.
              </p>
            </div>

            <Link
              href={`/super-admin/churches/${church.id}/users/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20"
            >
              <UserPlus className="h-4 w-4" />
              Créer l’admin principal
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ActionBox
              title="Créer l’admin principal"
              description="Associer un utilisateur à cette église avec le rôle administrateur."
            />

            <ActionBox
              title="Ajouter les premiers membres"
              description="Importer ou saisir les membres de cette communauté."
            />

            <ActionBox
              title="Tester la page publique"
              description="Vérifier les boutons prière, rendez-vous, rejoindre et témoignage."
            />
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}

function ActionBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DCEAF5] p-5">
      <h3 className="font-bold text-[#03357A]">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}