import Link from "next/link";
import { ExternalLink, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicChurchName } from "@/lib/church/public-name";

export default async function AdminChurchHomeLink() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role === "super_admin" || !profile.church_id) {
    return null;
  }

  if (profile.status && profile.status !== "active") {
    return null;
  }

  const { data: church } = await supabase
    .from("churches")
    .select("name, public_name, pwa_name, slug")
    .eq("id", profile.church_id)
    .maybeSingle();

  if (!church?.slug) {
    return null;
  }

  const churchPublicName = getPublicChurchName(church);

  return (
    <div className="border-b border-[#DCEAF5] bg-white/80 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          Espace administration —{" "}
          <span className="font-extrabold text-[#03357A]">
            {churchPublicName}
          </span>
        </p>

        <Link
          href={`/church/${church.slug}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#DCEAF5] bg-white px-4 py-2 text-sm font-extrabold text-[#03357A] shadow-sm hover:bg-[#EAF3FA]"
        >
          <Home className="h-4 w-4" />
          Page publique de l’église
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}