import Link from "next/link";
import {
  Activity,
  Building2,
  Church,
  Globe2,
  ShieldCheck,
  Users,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: churchesCount },
    { count: activeChurchesCount },
    { count: profilesCount },
    { count: membersCount },
  ] = await Promise.all([
    supabase.from("churches").select("*", { count: "exact", head: true }),
    supabase
      .from("churches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }),
  ]);

  const { data: churches } = await supabase
    .from("churches")
    .select("id, name, slug, city, country, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total églises"
            value={churchesCount ?? 0}
            description="Églises créées"
            icon={Church}
            accent="blue"
          />

          <MetricCard
            title="Églises actives"
            value={activeChurchesCount ?? 0}
            description="Plateforme active"
            icon={ShieldCheck}
            accent="green"
          />

          <MetricCard
            title="Utilisateurs"
            value={profilesCount ?? 0}
            description="Profils enregistrés"
            icon={Users}
            accent="purple"
          />

          <MetricCard
            title="Membres"
            value={membersCount ?? 0}
            description="Tous espaces confondus"
            icon={Building2}
            accent="blue"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Églises récentes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Les dernières églises ajoutées à la plateforme.
                </p>
              </div>

              <Link
                href="/super-admin/churches"
                className="text-sm font-bold text-[#2563EB]"
              >
                Voir tout
              </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#DCEAF5]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EAF3FA] text-[#03357A]">
                  <tr>
                    <th className="px-4 py-3">Église</th>
                    <th className="px-4 py-3">Ville</th>
                    <th className="px-4 py-3">Pays</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Lien</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCEAF5] bg-white">
                  {churches?.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Aucune église créée pour le moment.
                      </td>
                    </tr>
                  )}

                  {churches?.map((church) => (
                    <tr key={church.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">
                          {church.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          /church/{church.slug}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {church.city ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {church.country ?? "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                          {church.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/church/${church.slug}`}
                          target="_blank"
                          className="font-bold text-[#2563EB]"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-[#03357A]" />
                <h2 className="text-lg font-extrabold text-[#03357A]">
                  Activité plateforme
                </h2>
              </div>

              <div className="mt-6 space-y-5 border-l-2 border-[#DCEAF5] pl-5">
                <div>
                  <p className="text-xs font-bold text-[#8B5CF6]">
                    Aujourd’hui
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    La plateforme est active et opérationnelle.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#2563EB]">
                    Système
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Supabase connecté avec succès.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-green-600">
                    Sécurité
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Accès Super Admin protégé par authentification.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
              <Globe2 className="h-8 w-8" />

              <h2 className="mt-4 text-2xl font-extrabold">
                Plateforme multi-églises
              </h2>

              <p className="mt-3 text-sm leading-7 text-blue-50">
                Chaque église possède son espace, ses membres, ses présences,
                ses demandes publiques et son suivi pastoral.
              </p>

              <Link
                href="/super-admin/churches/new"
                className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A]"
              >
                Créer une nouvelle église
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}