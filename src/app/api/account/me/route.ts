import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Utilisateur non connecté." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role, status, church_id")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: profile?.id || user.id,
      full_name:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Utilisateur",
      email: profile?.email || user.email || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || "",
      role: profile?.role || "super_admin",
      status: profile?.status || "active",
      church_id: profile?.church_id || null,
    },
  });
}
