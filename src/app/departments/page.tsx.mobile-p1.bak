import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MetricCard from "@/components/dashboard/MetricCard";
import DepartmentImportBox from "@/components/departments/DepartmentImportBox";
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
  if (status === "active") return "bg-green-50 text-green-700";
  if (status === "inactive") return "bg-red-50 text-red-700";

  return "bg-slate-100 text-slate-600";
}

export default async function DepartmentsPage() {
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
    { count: totalDepartmentsCount },
    { count: activeDepartmentsCount },
    { count: memberDepartmentLinksCount },
    { data: departments, error },
  ] = await Promise.all([
    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId),

    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "active"),

    supabase
      .from("member_departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId),

    supabase
      .from("departments")
      .select("id, name, description, status, created_at")
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
                Organisation de l’église
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">Départements</h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Gérez les départements, ministères et services de votre église.
              </p>
            </div>

            <Link
              href="/departments/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-5 w-5" />
              Nouveau département
            </Link>
          </div>
        </section>

        <DepartmentImportBox churchId={churchId} />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total départements"
            value={totalDepartmentsCount ?? 0}
            description="Créés dans cette église"
            icon={Building2}
            accent="blue"
          />

          <MetricCard
            title="Départements actifs"
            value={activeDepartmentsCount ?? 0}
            description="Actuellement actifs"
            icon={CheckCircle2}
            accent="green"
          />

          <MetricCard
            title="Affectations"
            value={memberDepartmentLinksCount ?? 0}
            description="Membres affectés"
            icon={Users}
            accent="purple"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des départements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les départements affichés appartiennent uniquement à votre
                église.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher un département..."
                className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCEAF5]">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#EAF3FA] text-[#03357A]">
                <tr>
                  <th className="px-4 py-3">Département</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DCEAF5] bg-white">
                {error && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-red-600">
                      Erreur : {error.message}
                    </td>
                  </tr>
                )}

                {!error && departments?.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucun département trouvé.
                    </td>
                  </tr>
                )}

                {departments?.map((department: any) => (
                  <tr key={department.id} className="hover:bg-[#F8FBFD]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
                          <Building2 className="h-6 w-6" />
                        </div>

                        <div>
                          <p className="font-extrabold text-[#03357A]">
                            {department.name || "Département sans nom"}
                          </p>

                          <p className="text-xs text-slate-400">
                            ID : {department.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <p className="line-clamp-2">
                        {department.description || "Aucune description"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          department.status
                        )}`}
                      >
                        {department.status || "active"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(department.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/departments/${department.id}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#DCEAF5]"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}