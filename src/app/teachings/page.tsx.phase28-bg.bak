import Link from "next/link";
import { Archive, PlayCircle, Plus, Send } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { archiveTeachingAction, publishTeachingAction } from "./actions";

type TeachingsPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

export default async function TeachingsPage({
  searchParams,
}: TeachingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("teachings");

  let query = admin
    .from("church_teachings")
    .select("*")
    .eq("church_id", profile.church_id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  } else {
    query = query.neq("status", "archived");
  }

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  const { data: teachings } = await query;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                Volet spirituel
              </p>
              <h1 className="mt-3 text-3xl font-extrabold">Enseignements</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-50">
                Publiez des vidéos YouTube qui seront lues directement dans l’application et sur la page publique de l’église.
              </p>
            </div>

            <Link
              href="/teachings/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
            >
              <Plus className="h-4 w-4" />
              Nouvel enseignement
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-[#DCEAF5] bg-white p-5 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_140px]">
            <input
              name="q"
              defaultValue={params.q || ""}
              placeholder="Rechercher un enseignement..."
              className="min-h-12 rounded-2xl border border-[#DCEAF5] px-4 text-sm outline-none focus:border-[#03357A]"
            />

            <select
              name="status"
              defaultValue={params.status || "all"}
              className="min-h-12 rounded-2xl border border-[#DCEAF5] px-4 text-sm outline-none focus:border-[#03357A]"
            >
              <option value="all">Tous</option>
              <option value="draft">Brouillons</option>
              <option value="published">Publiés</option>
              <option value="archived">Archivés</option>
            </select>

            <button className="rounded-2xl bg-[#03357A] px-4 py-3 text-sm font-extrabold text-white">
              Filtrer
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(teachings ?? []).length === 0 ? (
              <div className="rounded-2xl bg-[#F8FBFD] p-6 text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                Aucun enseignement trouvé.
              </div>
            ) : (
              (teachings ?? []).map((teaching: any) => (
                <article
                  key={teaching.id}
                  className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD] shadow-sm"
                >
                  <Link href={`/teachings/${teaching.id}`} className="block">
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
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#03357A]">
                          <PlayCircle className="h-7 w-7" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 font-black text-[#03357A]">
                        {teaching.title}
                      </h2>
                      <span className="rounded-full bg-[#EAF3FA] px-3 py-1 text-xs font-black text-[#03357A]">
                        {statusLabels[teaching.status] || teaching.status}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {teaching.description || "Aucune description."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/teachings/${teaching.id}`}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-[#03357A]"
                      >
                        Ouvrir
                      </Link>

                      <Link
                        href={`/teachings/${teaching.id}/edit`}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-600"
                      >
                        Modifier
                      </Link>

                      {teaching.status !== "published" && (
                        <form action={publishTeachingAction}>
                          <input type="hidden" name="id" value={teaching.id} />
                          <button className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-sm font-extrabold text-green-700">
                            <Send className="h-4 w-4" />
                            Publier
                          </button>
                        </form>
                      )}

                      {teaching.status !== "archived" && (
                        <form action={archiveTeachingAction}>
                          <input type="hidden" name="id" value={teaching.id} />
                          <button className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700">
                            <Archive className="h-4 w-4" />
                            Archiver
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
