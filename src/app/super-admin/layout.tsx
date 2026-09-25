import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Super Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status && profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
