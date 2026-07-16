import Link from "next/link";
import { ArrowLeft, Archive, Edit, Send } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { requireChurchModuleAccess } from "@/lib/modules/moduleAccess";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { archiveTeachingAction, publishTeachingAction } from "../actions";

type TeachingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    published?: string;
    created?: string;
    updated?: string;
    error?: string;
    notifyWarning?: string;
  }>;
};

export default async function TeachingDetailPage({
  params,
  searchParams,
}: TeachingDetailPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { admin, profile } = await requireChurchModuleAccess("teachings");

  const { data: teaching } = await admin
    .from("church_teachings")
    .select("*")
    .eq("church_id", profile.church_id)
    .eq("id", id)
    .maybeSingle();

  if (!teaching) {
    return (
      <AppShell>
        <div className="rounded-3xl bg-white p-8 text-center font-black text-[#03357A]">
          Enseignement introuvable.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux enseignements
        </Link>

        {(query.created || query.updated || query.published) && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">
            {query.created
              ? "Enseignement enregistré."
              : query.updated
                ? "Enseignement mis à jour."
                : "Enseignement publié."}
          </div>
        )}

        {query.notifyWarning && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            Publication réussie, mais notification non envoyée :{" "}
            {query.notifyWarning}
          </div>
        )}

        {query.error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
            {query.error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
          <div className="aspect-video bg-[#F5F9FC]">
            <iframe
              src={getYouTubeEmbedUrl(teaching.youtube_video_id)}
              title={teaching.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-slate-400">
                  {teaching.category || "Enseignement"}
                </p>
                <h1 className="mt-2 text-3xl font-black text-[#03357A]">
                  {teaching.title}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {teaching.teacher_name || "Église"} · {teaching.status}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/teachings/${teaching.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#EAF3FA] px-4 py-3 text-sm font-extrabold text-[#03357A]"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>

                {teaching.status !== "published" && (
                  <form action={publishTeachingAction}>
                    <input type="hidden" name="id" value={teaching.id} />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-extrabold text-green-700">
                      <Send className="h-4 w-4" />
                      Publier
                    </button>
                  </form>
                )}

                {teaching.status !== "archived" && (
                  <form action={archiveTeachingAction}>
                    <input type="hidden" name="id" value={teaching.id} />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700">
                      <Archive className="h-4 w-4" />
                      Archiver
                    </button>
                  </form>
                )}
              </div>
            </div>

            {teaching.description && (
              <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">
                {teaching.description}
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
