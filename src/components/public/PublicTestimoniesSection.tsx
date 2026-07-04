import { MessageSquareHeart, Quote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PublicTestimoniesSectionProps = {
  churchId: string;
};

function getAuthor(testimony: any) {
  return (
    testimony.full_name ||
    testimony.name ||
    testimony.author_name ||
    testimony.member_name ||
    "Un membre de la communauté"
  );
}

function getContent(testimony: any) {
  return (
    testimony.content ||
    testimony.message ||
    testimony.testimony ||
    testimony.description ||
    ""
  );
}

export default async function PublicTestimoniesSection({
  churchId,
}: PublicTestimoniesSectionProps) {
  const supabase = await createClient();

  const { data: testimonies } = await supabase
    .from("testimonies")
    .select("*")
    .eq("church_id", churchId)
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .limit(6);

  const items = testimonies ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-[2rem] border border-[#DCEAF5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FA] text-[#03357A]">
            <MessageSquareHeart className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2563EB]">
              Témoignages
            </p>

            <h2 className="text-2xl font-black text-[#03357A]">
              Ce que Dieu fait dans notre communauté
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((testimony: any) => (
            <article
              key={testimony.id}
              className="rounded-3xl bg-[#F8FBFD] p-5"
            >
              <Quote className="h-8 w-8 text-[#8B5CF6]" />

              <p className="mt-4 line-clamp-6 text-sm leading-7 text-slate-600">
                {getContent(testimony)}
              </p>

              <p className="mt-5 font-extrabold text-[#03357A]">
                {getAuthor(testimony)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}