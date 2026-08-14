import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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
        { status: 403 }
      );
    }

    if (profile.status && profile.status !== "active") {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 }
      );
    }

    if (profile.role === "super_admin") {
      return NextResponse.json({
        role: profile.role,
        churchId: null,
        moduleCodes: [],
      });
    }

    if (!profile.church_id) {
      return NextResponse.json(
        { error: "Aucune église rattachée à ce compte." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const [{ data: enabledModules }, { data: profilePermissions }] = await Promise.all([
      admin
        .from("church_modules")
        .select("module_code")
        .eq("church_id", profile.church_id)
        .eq("enabled", true),

      admin
        .from("profile_module_permissions")
        .select("module_code, can_view")
        .eq("church_id", profile.church_id)
        .eq("profile_id", profile.id),
    ]);

    let permissions = profilePermissions ?? [];

    // Une affectation personnelle remplace les droits génériques du rôle.
    // Sans affectation personnelle, on applique strictement le rôle configuré.
    if (permissions.length === 0) {
      const { data: rolePermissions, error: rolePermissionError } = await admin
        .from("church_role_module_permissions")
        .select("module_code, can_view")
        .eq("church_id", profile.church_id)
        .eq("role_code", profile.role);

      if (rolePermissionError) {
        console.error("Chargement des permissions du rôle :", rolePermissionError.message);
      }

      permissions = rolePermissions ?? [];
    }

    const permissionCodes = new Set(
      permissions
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
    );

    const enabledCodes = new Set(
      (enabledModules ?? []).map((module: any) => module.module_code)
    );
    const systemCodes = new Set([
      "dashboard",
      "reports",
      "notifications",
      "ai_assistant",
      "pwa_install",
      "settings",
      "users",
      "security",
      "live_stream",
    ]);

    const moduleCodes = ["dashboard", ...Array.from(permissionCodes)]
      .filter((code) => systemCodes.has(code) || enabledCodes.has(code));

    return NextResponse.json({
      role: profile.role,
      churchId: profile.church_id,
      moduleCodes,
    });
  } catch (error) {
    console.error("Chargement des modules autorisés :", error);
    return NextResponse.json(
      { error: "Erreur pendant le chargement des modules." },
      { status: 500 }
    );
  }
}
