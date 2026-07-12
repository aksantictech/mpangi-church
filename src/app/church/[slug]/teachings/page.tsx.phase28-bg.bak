import Link from "next/link";
import { Bell, PlayCircle } from "lucide-react";
import NotificationPermissionCard from "@/components/notifications/NotificationPermissionCard";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicTeachingsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicTeachingsPage({
  params,
}: PublicTeachingsPageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: church } = await admin
    .from("churches")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!church) {
    return (
      <main className="min-h-screen bg-[#F5F9FC] p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">
          Église introuvable.
        </div>
      </main>
    );
  }

  const { data: teachings } = await admin
    .from("church_teachings")
    .select("*")
    .eq("church_id", church.id)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#F5F9FC] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            {church.name}
          </p>
          <h1 className="mt-3 text-4xl font-black">Enseignements</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
            Retrouvez les derniers enseignements vidéo de l’église directement dans l’application.
          </p>
        </section>

        <NotificationPermissionCard churchSlug={church.slug} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(teachings ?? []).length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-3">
              Aucun enseignement publié pour le moment.
            </div>
          ) : (
            (teachings ?? []).map((teaching: any) => (
              <Link
                key={teaching.id}
                href={`/church/${church.slug}/teachings/${teaching.id}`}
                className="group overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-video bg-slate-200">
                  {teaching.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teaching.thumbnail_url}
                      alt={teaching.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#03357A] transition group-hover:scale-110">
                      <PlayCircle className="h-7 w-7" />
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8B5CF6]">
                    {teaching.category || "Enseignement"}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-black text-[#03357A]">
                    {teaching.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {teaching.description || "Lire la vidéo dans l’application."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>

        <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
          <Bell className="mr-2 inline h-4 w-4 text-[#03357A]" />
          Activez les notifications pour recevoir les nouveaux enseignements.
        </div>
      </div>
    </main>
  );
}
