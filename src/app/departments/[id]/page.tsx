import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import { createClient } from "@/lib/supabase/server";

type DepartmentDetailsPageProps = {
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
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "inactive") return "bg-red-50 text-red-700";

  return "bg-slate-100 text-slate-600";
}

function getMemberName(member: any) {
  return [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(" ");
}

export default async function DepartmentDetailsPage({
  params,
}: DepartmentDetailsPageProps) {
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

  const { data: departmentRaw } = await supabase
    .from("departments")
    .select(
      `
      id,
      church_id,
      name,
      description,
      status,
      created_at,
      churches(id, name, slug)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!departmentRaw) {
    notFound();
  }

  const department = departmentRaw as any;

  if (department.church_id !== profile.church_id) {
    notFound();
  }

  const church = firstItem<any>(department.churches);

  const [{ count: membersCount }, { data: assignments }] = await Promise.all([
    supabase
      .from("member_departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", profile.church_id)
      .eq("department_id", department.id),

    supabase
      .from("member_departments")
      .select(
        `
        id,
        role,
        status,
        assigned_at,
        members(id, first_name, middle_name, last_name, phone, photo_url, status)
      `
      )
      .eq("church_id", profile.church_id)
      .eq("department_id", department.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux départements
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
                  <Building2 className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                    Fiche département
                  </p>

                  <h1 className="mt-2 text-3xl font-extrabold">
                    {department.name || "Département sans nom"}
                  </h1>

                  <p className="mt-2 text-sm text-blue-50">
                    {church?.name || "Église non renseignée"}
                  </p>
                </div>
              </div>

              <Link
                href={`/departments/${department.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <MetricCard
              title="Membres affectés"
              value={membersCount ?? 0}
              description="Dans ce département"
              icon={Users}
              accent="blue"
            />

            <MetricCard
              title="Statut"
              value={department.status || "active"}
              description="État du département"
              icon={ShieldCheck}
              accent={department.status === "active" ? "green" : "purple"}
            />

            <MetricCard
              title="Créé le"
              value={formatDate(department.created_at)}
              description="Date de création"
              icon={CalendarDays}
              accent="purple"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Informations
            </h2>

            <div className="mt-6 space-y-4">
              <InfoLine
                label="Nom"
                value={department.name || "Département sans nom"}
              />

              <InfoLine
                label="Église"
                value={church?.name || "Église non renseignée"}
              />

              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Statut
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                    department.status
                  )}`}
                >
                  {department.status || "active"}
                </span>
              </div>

              <div className="rounded-2xl bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {department.description || "Aucune description enregistrée."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#03357A]">
              Membres affectés
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Les membres sont ajoutés depuis la fiche membre, onglet
              Départements.
            </p>

            <div className="mt-6 space-y-3">
              {assignments?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#C9DBEA] bg-[#F8FBFD] p-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-[#3F79B3]" />

                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Aucun membre affecté à ce département.
                  </p>
                </div>
              )}

              {assignments?.map((assignment: any) => {
                const member = firstItem<any>(assignment.members);
                const memberName = member
                  ? getMemberName(member) || "Nom non renseigné"
                  : "Membre";

                return (
                  <article
                    key={assignment.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-5 md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#EAF3FA] text-[#03357A]">
                        {member?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photo_url}
                            alt={memberName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-6 w-6" />
                        )}
                      </div>

                      <div>
                        <p className="font-extrabold text-[#03357A]">
                          {memberName}
                        </p>

                        <p className="text-sm text-slate-500">
                          Rôle :{" "}
                          <span className="font-bold">
                            {assignment.role || "member"}
                          </span>{" "}
                          • Depuis le {formatDate(assignment.assigned_at)}
                        </p>
                      </div>
                    </div>

                    {member?.id && (
                      <Link
                        href={`/members/${member.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
                      >
                        Voir membre
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FBFD] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-700">{value}</p>
    </div>
  );
}