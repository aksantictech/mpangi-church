import { redirect } from "next/navigation";
import { BookOpenText, CalendarDays, PlayCircle, Star } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PublicationActions from "@/components/publications/PublicationActions";
import PublicationForm from "@/components/publications/PublicationForm";
import { createClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTypeLabel(type?: string | null) {
  if (type === "sermon") return "Prédication";
  if (type === "video") return "Vidéo";
  if (type === "message") return "Message";
  if (type === "announcement") return "Annonce";
  return "Enseignement";
}

export default async function PublicationsPage() {
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

  const { data: publications, error } = await supabase
    .from("church_publications")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false });

  const items = publications ?? [];

  const publishedCount = items.filter((item: any) => item.is_published).length;
  const featuredCount = items.filter((item: any) => item.is_featured).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <BookOpenText className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Publications
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Enseignements et vidéos
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Publiez les enseignements, vidéos, prédications et messages
                visibles sur la page publique de l’église.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total"
            value={items.length}
            description="Toutes les publications"
          />

          <StatCard
            title="Publiées"
            value={publishedCount}
            description="Visibles sur la page publique"
          />

          <StatCard
            title="En vedette"
            value={featuredCount}
            description="Mises en avant"
          />
        </section>

        <PublicationForm />

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#03357A]">
            Liste des publications
          </h2>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <BookOpenText className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-extrabold text-[#03357A]">
                  Aucune publication.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Créez votre premier enseignement ou message d’édification.
                </p>
              </div>
            ) : (
              items.map((publication: any) => (
                <article
                  key={publication.id}
                  className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-extrabold text-[#03357A]">
                          {getTypeLabel(publication.publication_type)}
                        </span>

                        {publication.is_published ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                            Publié
                          </span>
                        ) : (
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-700">
                            Brouillon
                          </span>
                        )}

                        {publication.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-extrabold text-yellow-700">
                            <Star className="h-3 w-3" />
                            Vedette
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-extrabold text-[#03357A]">
                        {publication.title}
                      </h3>

                      {publication.description && (
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                          {publication.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          Créé le {formatDate(publication.created_at)}
                        </span>

                        {publication.notified_at && (
                          <span>
                            Notification : {formatDate(publication.notified_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <PublicationActions
                      publicationId={publication.id}
                      isPublished={Boolean(publication.is_published)}
                      isFeatured={Boolean(publication.is_featured)}
                    />
                  </div>

                  {publication.video_url && (
                    <a
                      href={publication.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Ouvrir la vidéo
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#03357A]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}