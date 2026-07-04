import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  action?: "toggle" | "regenerate";
  enabled?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, church_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil utilisateur introuvable." },
        { status: 404 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
    }

    if (profile.role === "super_admin") {
      return NextResponse.json(
        { error: "Action réservée aux administrateurs d’église." },
        { status: 403 }
      );
    }

    if (!profile.church_id) {
      return NextResponse.json(
        { error: "Aucune église rattachée à ce compte." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (body.action === "toggle") {
      const { error } = await admin
        .from("churches")
        .update({
          member_form_enabled: Boolean(body.enabled),
        })
        .eq("id", profile.church_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "regenerate") {
      const { error } = await admin
        .from("churches")
        .update({
          member_form_token: crypto.randomUUID(),
          member_form_enabled: true,
        })
        .eq("id", profile.church_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Action invalide." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue." },
      { status: 500 }
    );
  }
}