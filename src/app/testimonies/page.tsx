import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MessageSquareHeart,
  UserCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TestimonyPublicToggleButton from "@/components/testimonies/TestimonyPublicToggleButton";
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

function getTestimonyAuthor(testimony: any) {
  return (
    testimony.full_name ||
    testimony.name ||
    testimony.author_name ||
    testimony.member_name ||
    "Auteur non renseigné"
  );
}

function getTestimonyContent(testimony: any) {
  return (
    testimony.content ||
    testimony.message ||
    testimony.testimony ||
    testimony.description ||
    "Témoignage non renseigné."
  );
}

function getTestimonyPhone(testimony: any) {
  return testimony.phone || testimony.whatsapp || testimony.contact || null;
}

export default async function TestimoniesPage() {
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

  const { data: testimonies, error } = await supabase
    .from("testimonies")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("created_at", { ascending: false });

  const items = testimonies ?? [];

  const publishedCount = items.filter((item: any) => item.is_public).length;
  const pendingCount = items.filter((item: any) => !item.is_public).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
              <MessageSquareHeart className="h-8 w-8" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Témoignages
              </p>

              <h1 className="mt-2 text-3xl font-extrabold">
                Témoignages reçus
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Validez les témoignages avant leur publication sur la page
                publique de l’église.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total témoignages"
            value={items.length}
            description="Tous les témoignages reçus"
          />

          <StatCard
            title="Publiés"
            value={publishedCount}
            description="Visibles sur la page publique"
          />

          <StatCard
            title="En attente"
            value={pendingCount}
            description="Non publiés"
          />
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-[#03357A]">
                Liste des témoignages
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les témoignages envoyés depuis la page publique apparaissent
                ici.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-3xl bg-[#F8FBFD] p-8 text-center">
                <MessageSquareHeart className="mx-auto h-12 w-12 text-[#3F79B3]" />

                <p className="mt-4 font-extrabold text-[#03357A]">
                  Aucun témoignage reçu.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Les visiteurs peuvent envoyer leurs témoignages depuis la page
                  publique de l’église.
                </p>
              </div>
            ) : (
              items.map((testimony: any) => {
                const author = getTestimonyAuthor(testimony);
                const content = getTestimonyContent(testimony);
                const phone = getTestimonyPhone(testimony);

                return (
                  <article
                    key={testimony.id}
                    className="rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#03357A] shadow-sm">
                          <UserCircle className="h-6 w-6" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-extrabold text-[#03357A]">
                              {author}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                                testimony.is_public
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-orange-700"
                              }`}
                            >
                              {testimony.is_public ? "Publié" : "En attente"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(testimony.created_at)}
                            </span>

                            {phone && <span>{phone}</span>}
                          </div>
                        </div>
                      </div>

                      <TestimonyPublicToggleButton
                        testimonyId={testimony.id}
                        isPublic={Boolean(testimony.is_public)}
                        profileId={profile.id}
                      />
                    </div>

                    <p className="mt-4 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600">
                      {content}
                    </p>

                    {testimony.is_public && testimony.published_at && (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Publié le {formatDate(testimony.published_at)}
                      </p>
                    )}
                  </article>
                );
              })
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