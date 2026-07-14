import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
type AllowedRole =
  | "church_admin"
  | "pastor"
  | "department_leader"
  | "worker"
  | "member";

type AllowedStatus = "active" | "inactive";

type UpdatePayload = {
  action: "update_role" | "update_status" | "reset_password";
  role?: AllowedRole;
  status?: AllowedStatus;
  password?: string;
};

type RouteProps = {
  params: Promise<{
    profileId: string;
  }>;
};

const allowedRoles: AllowedRole[] = [
  "church_admin",
  "pastor",
  "department_leader",
  "worker",
  "member",
];

const allowedStatuses: AllowedStatus[] = ["active", "inactive"];

export async function PATCH(request: Request, { params }: RouteProps) {
  await requireSuperAdminAccess();
  try {
    const { profileId } = await params;
    const payload = (await request.json()) as UpdatePayload;

    if (!profileId) {
      return NextResponse.json(
        { message: "Profil utilisateur obligatoire." },
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

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentProfile?.role !== "super_admin") {
      return NextResponse.json(
        { message: "Accès refusé. Réservé au Super Admin." },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: targetProfile, error: targetProfileError } =
      await adminSupabase
        .from("profiles")
        .select("id, user_id, role, status")
        .eq("id", profileId)
        .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json(
        { message: targetProfileError.message },
        { status: 400 }
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        { message: "Profil utilisateur introuvable." },
        { status: 404 }
      );
    }

    if (!targetProfile.user_id) {
      return NextResponse.json(
        { message: "Ce profil n’est lié à aucun compte Auth." },
        { status: 400 }
      );
    }

    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        {
          message:
            "Le compte Super Admin principal ne peut pas être modifié ici.",
        },
        { status: 400 }
      );
    }

    if (payload.action === "update_role") {
      if (!payload.role || !allowedRoles.includes(payload.role)) {
        return NextResponse.json(
          { message: "Rôle invalide ou manquant." },
          { status: 400 }
        );
      }

      const { error } = await adminSupabase
        .from("profiles")
        .update({ role: payload.role })
        .eq("id", profileId);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      await adminSupabase.auth.admin.updateUserById(targetProfile.user_id, {
        user_metadata: {
          role: payload.role,
        },
      });

      return NextResponse.json({ message: "Rôle modifié avec succès." });
    }

    if (payload.action === "update_status") {
      if (!payload.status || !allowedStatuses.includes(payload.status)) {
        return NextResponse.json(
          { message: "Statut invalide ou manquant." },
          { status: 400 }
        );
      }

      const { error } = await adminSupabase
        .from("profiles")
        .update({ status: payload.status })
        .eq("id", profileId);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      await adminSupabase.auth.admin.updateUserById(targetProfile.user_id, {
        user_metadata: {
          status: payload.status,
        },
      });

      return NextResponse.json({ message: "Statut modifié avec succès." });
    }

    if (payload.action === "reset_password") {
      if (!payload.password || payload.password.length < 6) {
        return NextResponse.json(
          { message: "Le mot de passe doit contenir au moins 6 caractères." },
          { status: 400 }
        );
      }

      const { error } = await adminSupabase.auth.admin.updateUserById(
        targetProfile.user_id,
        {
          password: payload.password,
        }
      );

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      return NextResponse.json({
        message: "Mot de passe réinitialisé avec succès.",
      });
    }

    return NextResponse.json({ message: "Action inconnue." }, { status: 400 });
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