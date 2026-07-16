import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function CurrentChurchLiveRedirectPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const {
    data: profile,
  } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.church_id) {
    redirect("/dashboard");
  }

  const {
    data: church,
  } = await supabase
    .from("churches")
    .select("slug")
    .eq(
      "id",
      profile.church_id
    )
    .maybeSingle();

  if (!church?.slug) {
    redirect("/dashboard");
  }

  redirect(
    `/church/${church.slug}/live`
  );
}
