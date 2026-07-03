import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié." },
      { status: 401 }
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json(
      { error: "Accès refusé." },
      { status: 403 }
    );
  }

  if (profile.status && profile.status !== "active") {
    return NextResponse.json(
      { error: "Compte inactif." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    role: "super_admin",
  });
}