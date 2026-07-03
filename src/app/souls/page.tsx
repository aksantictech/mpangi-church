import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Eye,
  HeartHandshake,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createClient } from "@/lib/supabase/server";

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

function getSoulName(followup: any) {
  if (followup.full_name) return followup.full_name;

  const member = Array.isArray(followup.members)
    ? followup.members[0]
    : followup.members;

  if (member) {
    return [member.first_name, member.middle_name, member.last_name]
      .filter(Boolean)
      .join(" ");
  }

  return "Nom non renseigné";
}

export default async function SoulsPage() {
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

  const churchId = profile.church_id;

  const [
    { count: totalFollowupsCount },
    { count: newFollowupsCount },
    { count: inProgressFollowupsCount },
    { count: integratedFollowupsCount },
    { data: followups, error },
  ] = await Promise.all([
    supabase
      .from("soul_followups")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId),

    supabase
      .from("soul_followups")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "nouveau"),

    supabase
      .from("soul_followups")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "en_cours"),

    supabase
      .from("soul_followups")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "integre"),

    supabase
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
        created_at,
        members(id, first_name, middle_name, last_name, phone, photo_url)
      `
      )
      .eq("church_id", churchId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Suivi pastoral
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Suivi des âmes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Suivez les nouvelles personnes, les demandes de prière, les
                rendez-vous pastoraux et les parcours d’intégration.
              </p>
            </div>

            <Link
              href="/souls/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-5 w-5" />
              Nouveau suivi
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total suivis"
            value={totalFollowupsCount ?? 0}
            description="Dans cette église"
            icon={HeartHandshake}
            accent="blue"
          />

          <MetricCard
            title="Nouveaux"
            value={newFollowupsCount ?? 0}
            description="À contacter"
            icon={Users}
            accent="purple"
          />

          <MetricCard
            title="En cours"
            value={inProgressFollowupsCount ?? 0}
            description="Accompagnement actif"
            icon={CalendarDays}
            accent="blue"
          />

          <MetricCard
            title="Intégrés"
            value={integratedFollowupsCount ?? 0}
            description="Convertis en membres"
            icon={ShieldCheck}
            accent="green"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des suivis
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les suivis affichés appartiennent uniquement à votre église.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher une personne..."
                className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Personne</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Besoin</th>
                  <th className="px-4 py-3">Priorité</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Prochain suivi</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-red-600">
                      Erreur : {error.message}
                    </td>
                  </tr>
                )}

                {!error && followups?.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun suivi pastoral trouvé.
                    </td>
                  </tr>
                )}

                {followups?.map((followup: any) => {
                  const member = Array.isArray(followup.members)
                    ? followup.members[0]
                    : followup.members;

                  const name = getSoulName(followup);
                  const phone = followup.phone || member?.phone || "-";

                  return (
                    <tr key={followup.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] font-bold text-[#03357A]">
                            {member?.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.photo_url}
                                alt={name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserCircle className="h-6 w-6" />
                            )}
                          </div>

                          <div>
                            <p className="font-extrabold text-[#03357A]">
                              {name}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID : {followup.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#3F79B3]" />
                          {phone}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {followup.source || "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {followup.need_type || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(
                            followup.priority
                          )}`}
                        >
                          {followup.priority || "normale"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            followup.status
                          )}`}
                        >
                          {followup.status || "nouveau"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(followup.next_followup_date)}
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/souls/${followup.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}