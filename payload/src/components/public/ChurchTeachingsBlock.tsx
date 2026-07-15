import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildChurchPublicUrl } from "@/lib/tenant/domain";

export default async function ChurchTeachingsBlock({
  churchId,
  slug,
}: {
  churchId: string;
  slug: string;
}) {
  const admin = createAdminClient();

  const { data: teachings } = await admin
    .from("church_teachings")
    .select("id, title, description, thumbnail_url, category")
    .eq("church_id", churchId)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  if (!teachings || teachings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#8B5CF6]">
            Enseignements
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#03357A]">
            Dernières vidéos
          </h2>
        </div>

        <Link
          href={buildChurchPublicUrl({ slug }, "/public-teachings")}
          className="rounded-2xl bg-[#EAF3FA] px-4 py-2 text-sm font-extrabold text-[#03357A]"
        >
          Voir tout
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {teachings.map((teaching: any) => (
          <Link
            key={teaching.id}
            href={buildChurchPublicUrl({ slug }, `/public-teachings/${teaching.id}`)}
            className="group overflow-hidden rounded-3xl border border-[#DCEAF5] bg-[#F8FBFD]"
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
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#03357A]">
                  <PlayCircle className="h-6 w-6" />
                </span>
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#8B5CF6]">
                {teaching.category || "Vidéo"}
              </p>
              <h3 className="mt-2 line-clamp-2 font-black text-[#03357A]">
                {teaching.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
