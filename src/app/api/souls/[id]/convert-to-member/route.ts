import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function splitFullName(fullName?: string | null) {
  const cleanName = fullName?.trim() || "Visiteur";
  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      last_name: "",
    };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export async function POST(_request: Request, { params }: RouteProps) {
  await requireAnyActionPermission(["souls","members"], "create");
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Identifiant du suivi obligatoire." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Session expirée. Reconnectez-vous." },
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
        { message: "Profil utilisateur introuvable." },
        { status: 403 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { message: "Ce compte est désactivé." },
        { status: 403 }
      );
    }

    const { data: followup, error: followupError } = await supabase
      .from("soul_followups")
      .select(
        `
        id,
        church_id,
        member_id,
        full_name,
        phone,
        notes
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (followupError) {
      return NextResponse.json(
        { message: followupError.message },
        { status: 400 }
      );
    }

    if (!followup) {
      return NextResponse.json(
        { message: "Suivi pastoral introuvable." },
        { status: 404 }
      );
    }

    const canManage =
      profile.role === "super_admin" || profile.church_id === followup.church_id;

    if (!canManage) {
      return NextResponse.json(
        { message: "Accès refusé pour ce suivi pastoral." },
        { status: 403 }
      );
    }

    if (followup.member_id) {
      return NextResponse.json({
        message: "Ce suivi est déjà lié à un membre.",
        memberId: followup.member_id,
      });
    }

    const { first_name, last_name } = splitFullName(followup.full_name);

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        church_id: followup.church_id,
        first_name,
        last_name,
        phone: followup.phone || null,
        status: "actif",
      })
      .select("id")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        {
          message:
            memberError?.message || "Erreur lors de la création du membre.",
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("soul_followups")
      .update({
        member_id: member.id,
        status: "integre",
      })
      .eq("id", followup.id);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Membre créé avec succès.",
      memberId: member.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Une erreur inconnue est survenue.",
      },
      { status: 500 }
    );
  }
}