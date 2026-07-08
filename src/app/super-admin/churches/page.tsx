import Link from "next/link";
// import { UserPlus } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  Church,
  ExternalLink,
  Eye,
  Globe2,
  MapPin,
  Pencil,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import MetricCard from "@/components/dashboard/MetricCard";
import ChurchStatusActionButton from "@/components/super-admin/ChurchStatusActionButton";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminChurchesPage() {
  const supabase = await createClient();

  const [
    { count: churchesCount },
    { count: activeChurchesCount },
    { data: churches, error },
  ] = await Promise.all([
    supabase.from("churches").select("*", { count: "exact", head: true }),

    supabase
      .from("churches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("churches")
      .select(
        "id, name, slug, logo_url, address, city, country, phone, whatsapp, status, created_at"
      )
      .order("created_at", { ascending: false }),
  ]);

  const countriesCount = new Set(
    churches?.map((church) => church.country).filter(Boolean) as string[]
  ).size;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Gestion multi-églises
              </p>

              <h1 className="mt-3 text-3xl font-extrabold">
                Églises de la plateforme
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-50">
                Ajoutez, consultez, modifiez et administrez toutes les églises
                gérées par Mpangi-church.
              </p>
            </div>

            <Link
              href="/super-admin/churches/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-5 w-5" />
              Ajouter une église
            </Link><Link
href="/super-admin/users/new"
className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-extrabold text-white"
>
 <UserPlus className="h-4 w-4" />
 Créer un utilisateur
</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total églises"
            value={churchesCount ?? 0}
            description="Créées sur la plateforme"
            icon={Church}
            accent="blue"
          />

          <MetricCard
            title="Églises actives"
            value={activeChurchesCount ?? 0}
            description="Statut actif"
            icon={CheckCircle2}
            accent="green"
          />

          <MetricCard
            title="Pays couverts"
            value={countriesCount}
            description="Selon les églises créées"
            icon={Globe2}
            accent="purple"
          />

          <MetricCard
            title="Mode"
            value="MVP"
            description="Version de démarrage"
            icon={Building2}
            accent="blue"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des églises
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Chaque église possède son espace et sa page publique.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Rechercher une église..."
                className="h-12 w-full rounded-2xl border border-[#DCEAF5] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#03357A] focus:ring-4 focus:ring-[#03357A]/10"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 xl:col-span-2">
                Erreur de chargement des églises : {error.message}
              </div>
            )}

            {!error && churches?.length === 0 && (
              <div className="rounded-2xl border border-[#DCEAF5] bg-[#F8FBFD] p-8 text-center xl:col-span-2">
                <Church className="mx-auto h-10 w-10 text-[#3F79B3]" />

                <h3 className="mt-4 text-lg font-bold text-[#03357A]">
                  Aucune église créée
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Commencez par ajouter votre première église.
                </p>

                <Link
                  href="/super-admin/churches/new"
                  className="mt-5 inline-flex rounded-2xl bg-[#03357A] px-5 py-3 text-sm font-bold text-white"
                >
                  Ajouter une église
                </Link>
              </div>
            )}

            {churches?.map((church) => {
              const location = [church.city, church.country]
                .filter(Boolean)
                .join(", ");

              return (
                <article
                  key={church.id}
                  className="group overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-36 bg-gradient-to-br from-[#03357A] via-[#3F79B3] to-[#8B5CF6]">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#03357A]/70 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white text-[#03357A] shadow-sm">
                          {church.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={church.logo_url}
                              alt={`Logo ${church.name}`}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <Church className="h-7 w-7" />
                          )}
                        </div>

                        <div>
                          <h3 className="line-clamp-1 text-lg font-extrabold text-white">
                            {church.name}
                          </h3>

                          <p className="text-xs text-blue-100">
                            /church/{church.slug}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          church.status === "active"
                            ? "bg-green-50 text-green-700"
                            : church.status === "archived"
                              ? "bg-slate-100 text-slate-600"
                              : church.status === "suspended"
                                ? "bg-red-50 text-red-700"
                                : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {church.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#3F79B3]" />
                        <span>{location || "Localisation non définie"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-[#3F79B3]" />
                        <span>{church.slug}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-[#DCEAF5] pt-4">
                      <Link
                        href={`/super-admin/churches/${church.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>

                      <Link
                        href={`/super-admin/churches/${church.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCEAF5] px-4 py-2 text-sm font-bold text-[#03357A] hover:bg-[#EAF3FA]"
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>

                      {church.status === "active" ? (
                        <ChurchStatusActionButton
                          churchId={church.id}
                          currentStatus={church.status}
                          action="disable"
                        />
                      ) : (
                        <ChurchStatusActionButton
                          churchId={church.id}
                          currentStatus={church.status}
                          action="activate"
                        />
                      )}

                      {church.status !== "archived" && (
                        <ChurchStatusActionButton
                          churchId={church.id}
                          currentStatus={church.status}
                          action="archive"
                        />
                      )}

                      <Link
                        href={`/church/${church.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#03357A] to-[#2563EB] px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-[#022B63] hover:to-[#1D4ED8]"
                      >
                        Page publique
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </SuperAdminShell>
  );
}