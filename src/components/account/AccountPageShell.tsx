import AppShell from "@/components/layout/AppShell";
import SuperAdminShell from "@/components/layout/SuperAdminShell";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  if (profile?.role === "super_admin") {
    return <SuperAdminShell>{children}</SuperAdminShell>;
  }

  return <AppShell>{children}</AppShell>;
}