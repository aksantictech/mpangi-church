import Link from "next/link";
import { redirect } from "next/navigation";
import MemberRowActions from "@/components/members/MemberRowActions";
import {
  CalendarDays,
  Eye,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MemberImportBox from "@/components/members/MemberImportBox";
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
  if (status === "actif") return "bg-green-50 text-green-700";
  if (status === "inactif") return "bg-red-50 text-red-700";
  if (status === "suspendu") return "bg-orange-50 text-orange-700";

  return "bg-slate-100 text-slate-600";
}

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

export default async function MembersPage() {
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
    { count: totalMembersCount },
    { count: activeMembersCount },
    { count: inactiveMembersCount },
    { data: members, error },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId),

    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "actif"),

    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "inactif"),

    supabase
      .from("members")
      .select(
        `
        id,
        first_name,
        middle_name,
        last_name,
        phone,
        email,
        photo_url,
        member_type,
        status,
        created_at
      `
      )
      .eq("church_id", churchId)
        .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Gestion des membres
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Membres de l’église
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Consultez, ajoutez et gérez les membres de votre communauté.
                Cette liste est automatiquement filtrée selon votre église.
              </p>
            </div>

            <Link
              href="/members/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-5 w-5" />
              Nouveau membre
            </Link>
          </div>
        </section>

        <MemberImportBox churchId={churchId} profileId={profile.id} />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total membres"
            value={totalMembersCount ?? 0}
            description="Dans cette église"
            icon={Users}
            accent="blue"
          />

          <MetricCard
            title="Membres actifs"
            value={activeMembersCount ?? 0}
            description="Statut actif"
            icon={ShieldCheck}
            accent="green"
          />

          <MetricCard
            title="Membres inactifs"
            value={inactiveMembersCount ?? 0}
            description="À suivre"
            icon={CalendarDays}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des membres
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les membres affichés appartiennent uniquement à votre église.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher un membre..."
                className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-red-600">
                      Erreur : {error.message}
                    </td>
                  </tr>
                )}

                {!error && members?.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun membre trouvé.
                    </td>
                  </tr>
                )}

                {members?.map((member: any) => {
                  const name = getMemberName(member) || "Nom non renseigné";

                  return (
                    <tr key={member.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] font-bold text-[#03357A]">
                            {member.photo_url ? (
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
                            <p className="font-bold text-slate-800">{name}</p>

                            <p className="text-xs text-slate-400">
                              ID : {member.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#3F79B3]" />
                          {member.phone || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {member.email || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-bold text-[#03357A]">
                          {member.member_type || "membre"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            member.status
                          )}`}
                        >
                          {member.status || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {formatDate(member.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <MemberRowActions
  memberId={member.id}
  memberName={[member.first_name, member.last_name].filter(Boolean).join(" ")}
  status={member.status}
  archivedAt={member.archived_at}
/>
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