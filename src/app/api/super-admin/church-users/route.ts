import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
type CreateChurchUserPayload = {
  churchId: string;
  fullName: string;
  email: string;
  password: string;
  role: "church_admin" | "pastor" | "department_leader" | "worker" | "member";
};

export async function POST(request: Request) {
  await requireSuperAdminAccess();
  try {
    const payload = (await request.json()) as CreateChurchUserPayload;

    if (!payload.churchId) {
      return NextResponse.json(
        { message: "L’église est obligatoire." },
        { status: 400 }
      );
    }

    if (!payload.fullName?.trim()) {
      return NextResponse.json(
        { message: "Le nom complet est obligatoire." },
        { status: 400 }
      );
    }

    if (!payload.email?.trim()) {
      return NextResponse.json(
        { message: "L’email est obligatoire." },
        { status: 400 }
      );
    }

    if (!payload.password || payload.password.length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 6 caractères." },
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

    const { data: church } = await adminSupabase
      .from("churches")
      .select("id, name")
      .eq("id", payload.churchId)
      .maybeSingle();

    if (!church) {
      return NextResponse.json(
        { message: "Église introuvable." },
        { status: 404 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.fullName.trim(),
          church_id: payload.churchId,
          role: payload.role,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          message:
            createUserError?.message ||
            "Erreur lors de la création du compte utilisateur.",
        },
        { status: 400 }
      );
    }

    const { error: profileError } = await adminSupabase.from("profiles").upsert(
      {
        user_id: createdUser.user.id,
        church_id: payload.churchId,
        full_name: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        status: "actif",
      },
      {
        onConflict: "user_id",
      }
    );

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(createdUser.user.id);

      return NextResponse.json(
        {
          message:
            profileError.message ||
            "Utilisateur créé, mais erreur lors de la création du profil.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Compte utilisateur créé avec succès.",
      userId: createdUser.user.id,
      churchId: payload.churchId,
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