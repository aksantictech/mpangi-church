import {
  BookOpenText,
  CalendarDays,
  ImageIcon,
  PlayCircle,
  Star,
} from "lucide-react";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PublicationActions from "@/components/publications/PublicationActions";
import PublicationForm from "@/components/publications/PublicationForm";
import { createClient } from "@/lib/supabase/server";

function formatDate(
  value?: string | null
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

function getTypeLabel(
  type?: string | null
) {
  if (type === "news") {
    return "Actualité";
  }

  if (type === "event") {
    return "Événement";
  }

  if (
    type === "announcement"
  ) {
    return "Annonce";
  }

  if (type === "sermon") {
    return "Prédication";
  }

  if (type === "video") {
    return "Vidéo";
  }

  if (type === "message") {
    return "Message";
  }

  return "Enseignement";
}

export default async function PublicationsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select(
        "id, role, church_id, status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    !profile ||
    !profile.church_id ||
    (
      profile.status &&
      !["active", "actif"].includes(
        profile.status
      )
    )
  ) {
    redirect("/login");
  }

  if (
    profile.role ===
    "super_admin"
  ) {
    redirect(
      "/super-admin/dashboard"
    );
  }

  const {
    data: publications,
    error,
  } = await supabase
    .from("church_publications")
    .select(
      `
      id,
      title,
      excerpt,
      content,
      category,
      image_url,
      video_url,
      status,
      is_public,
      is_featured,
      notify_subscribers,
      published_at,
      notified_at,
      created_at
    `
    )
    .eq(
      "church_id",
      profile.church_id
    )
    .order("created_at", {
      ascending: false,
    });

  const items =
    publications ?? [];

  const publishedCount =
    items.filter(
      (item: any) =>
        item.status ===
        "published"
    ).length;

  const featuredCount =
    items.filter(
      (item: any) =>
        item.is_featured
    ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BookOpenText className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Publications
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Actualités et
                enseignements
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Publiez les événements,
                annonces, photos,
                vidéos, prédications et
                messages visibles sur la
                page publique de
                l’église.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total"
            value={items.length}
            description="Toutes les publications"
          />

          <StatCard
            title="Publiées"
            value={
              publishedCount
            }
            description="Visibles publiquement"
          />

          <StatCard
            title="En vedette"
            value={
              featuredCount
            }
            description="Mises en avant"
          />
        </section>

        <PublicationForm />

        <section className="rounded-[1.75rem] border border-[#DCEAF5] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-black text-[#03357A]">
            Liste des
            publications
          </h2>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {items.length ===
            0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <BookOpenText className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-black text-[#03357A]">
                  Aucune publication.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Créez votre première
                  actualité, annonce ou
                  publication.
                </p>
              </div>
            ) : (
              items.map(
                (
                  publication: any
                ) => (
                  <article
                    key={
                      publication.id
                    }
                    className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD]"
                  >
                    {publication.image_url && (
                      <div className="relative aspect-[16/7] overflow-hidden bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            publication.image_url
                          }
                          alt={
                            publication.title
                          }
                          className="h-full w-full object-cover"
                        />

                        {publication.is_featured && (
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-amber-700 shadow">
                            <Star className="h-3 w-3 fill-current" />
                            En vedette
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                              {getTypeLabel(
                                publication.category
                              )}
                            </span>

                            {publication.status ===
                            "published" ? (
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                                Publié
                              </span>
                            ) : (
                              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                                Brouillon
                              </span>
                            )}

                            {publication.is_featured &&
                              !publication.image_url && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
                                  <Star className="h-3 w-3" />
                                  Vedette
                                </span>
                              )}
                          </div>

                          <h3 className="mt-3 break-words text-lg font-black text-[#03357A]">
                            {
                              publication.title
                            }
                          </h3>

                          {publication.excerpt && (
                            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">
                              {
                                publication.excerpt
                              }
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              Créé le{" "}
                              {formatDate(
                                publication.created_at
                              )}
                            </span>

                            {publication.notified_at && (
                              <span>
                                Notification :{" "}
                                {formatDate(
                                  publication.notified_at
                                )}
                              </span>
                            )}

                            {publication.image_url && (
                              <span className="inline-flex items-center gap-1">
                                <ImageIcon className="h-4 w-4" />
                                Photo de couverture
                              </span>
                            )}
                          </div>
                        </div>

                        <PublicationActions
                          publicationId={
                            publication.id
                          }
                          isPublished={
                            publication.status ===
                            "published"
                          }
                          isFeatured={Boolean(
                            publication.is_featured
                          )}
                        />
                      </div>

                      {publication.video_url && (
                        <a
                          href={
                            publication.video_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Ouvrir la vidéo
                        </a>
                      )}
                    </div>
                  </article>
                )
              )
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
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#03357A]">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}
