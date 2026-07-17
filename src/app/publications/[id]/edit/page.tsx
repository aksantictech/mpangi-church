import Link from "next/link";
import {
  ArrowLeft,
  BookOpenText,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import PublicationEditForm, {
  type PublicationEditData,
} from "@/components/publications/PublicationEditForm";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPublicationPage({
  params,
}: PageProps) {
  const { id } = await params;
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

  if (
    !profile ||
    !profile.church_id ||
    (profile.status &&
      !["active", "actif"].includes(
        profile.status
      ))
  ) {
    redirect("/login");
  }

  if (profile.role === "super_admin") {
    redirect(
      "/super-admin/dashboard"
    );
  }

  const {
    data: publication,
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
        is_featured
      `
    )
    .eq("id", id)
    .eq(
      "church_id",
      profile.church_id
    )
    .maybeSingle();

  if (error || !publication) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/publications"
          className="inline-flex items-center gap-2 text-sm font-black text-[#2563EB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux publications
        </Link>

        <section className="rounded-[1.75rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-5 text-white shadow-lg shadow-blue-900/20 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BookOpenText className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Publications
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Modifier la publication
              </h1>

              <p className="mt-2 text-sm text-blue-50">
                Modifiez le contenu, la photo et la visibilité.
              </p>
            </div>
          </div>
        </section>

        <PublicationEditForm
          publication={
            publication as PublicationEditData
          }
        />
      </div>
    </AppShell>
  );
}