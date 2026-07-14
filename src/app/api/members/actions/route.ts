import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireAnyActionPermission } from "@/lib/security/secureAction";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";
type MemberAction = "activate" | "deactivate" | "archive" | "delete";

type RequestBody = {
  memberId?: string;
  action?: MemberAction;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      error: "Utilisateur non connecté.",
      status: 401,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      profile: null,
      error: "Profil utilisateur introuvable.",
      status: 403,
    };
  }

  if (profile.status && profile.status !== "active") {
    return {
      profile: null,
      error: "Compte désactivé.",
      status: 403,
    };
  }

  if (profile.role === "super_admin") {
    return {
      profile: null,
      error: "Action réservée aux administrateurs d’église.",
      status: 403,
    };
  }

  if (!profile.church_id) {
    return {
      profile: null,
      error: "Aucune église rattachée à ce compte.",
      status: 403,
    };
  }

  return {
    profile,
    error: null,
    status: 200,
  };
}

export async function POST(request: Request) {
  await requireAnyActionPermission(["members"], "create");
  try {
    const body = (await request.json()) as RequestBody;

    const memberId = getString(body.memberId);
    const action = body.action;

    if (!memberId || !action) {
      return NextResponse.json(
        { error: "Action membre invalide." },
        { status: 400 }
      );
    }

    if (!["activate", "deactivate", "archive", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Type d’action invalide." },
        { status: 400 }
      );
    }

    const { profile, error, status } = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const admin = createAdminClient();

    const { data: member } = await admin
      .from("members")
      .select("id, church_id, first_name, last_name, status")
      .eq("id", memberId)
      .eq("church_id", profile.church_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable dans votre église." },
        { status: 404 }
      );
    }

    if (action === "activate") {
      const { error: updateError } = await admin
        .from("members")
        .update({
          status: "actif",
          qr_enabled: true,
          archived_at: null,
          archived_by: null,
        })
        .eq("id", memberId)
        .eq("church_id", profile.church_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Membre réactivé avec succès.",
      });
    }

    if (action === "deactivate") {
      const { error: updateError } = await admin
        .from("members")
        .update({
          status: "inactif",
          qr_enabled: false,
        })
        .eq("id", memberId)
        .eq("church_id", profile.church_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Membre désactivé avec succès.",
      });
    }

    if (action === "archive") {
      const { error: updateError } = await admin
        .from("members")
        .update({
          status: "inactif",
          qr_enabled: false,
          archived_at: new Date().toISOString(),
          archived_by: profile.id,
        })
        .eq("id", memberId)
        .eq("church_id", profile.church_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Membre archivé avec succès.",
      });
    }

    if (action === "delete") {
      await admin
        .from("member_departments")
        .delete()
        .eq("member_id", memberId)
        .eq("church_id", profile.church_id);

      await admin
        .from("member_trainings")
        .delete()
        .eq("member_id", memberId)
        .eq("church_id", profile.church_id);

      const { error: deleteError } = await admin
        .from("members")
        .delete()
        .eq("id", memberId)
        .eq("church_id", profile.church_id);

      if (deleteError) {
        return NextResponse.json(
          {
            error:
              deleteError.message ||
              "Impossible de supprimer ce membre. Il est peut-être lié à des présences ou autres données.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Membre supprimé définitivement.",
      });
    }

    return NextResponse.json(
      { error: "Action non traitée." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant l’action membre." },
      { status: 500 }
    );
  }
}