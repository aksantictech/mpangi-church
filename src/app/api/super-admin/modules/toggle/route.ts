import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
type ToggleModuleBody = {
  churchId?: string;
  moduleCode?: string;
  enabled?: boolean;
};

function getString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

async function requireSuperAdmin() {
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
    .select("id, role, status")
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

  if (profile.role !== "super_admin") {
    return {
      profile: null,
      error: "Action réservée au super admin.",
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
  await requireSuperAdminAccess();
  try {
    const body = (await request.json()) as ToggleModuleBody;

    const churchId = getString(body.churchId);
    const moduleCode = getString(body.moduleCode);
    const enabled = Boolean(body.enabled);

    if (!churchId || !moduleCode) {
      return NextResponse.json(
        { error: "Église ou module manquant." },
        { status: 400 }
      );
    }

    const { profile, error, status } = await requireSuperAdmin();

    if (!profile) {
      return NextResponse.json({ error }, { status });
    }

    const admin = createAdminClient();

    const { data: module } = await admin
      .from("app_modules")
      .select("code, is_core")
      .eq("code", moduleCode)
      .maybeSingle();

    if (!module) {
      return NextResponse.json(
        { error: "Module introuvable." },
        { status: 404 }
      );
    }

    if (module.is_core && !enabled) {
      return NextResponse.json(
        { error: "Ce module principal ne peut pas être désactivé." },
        { status: 400 }
      );
    }

    const { data: church } = await admin
      .from("churches")
      .select("id")
      .eq("id", churchId)
      .maybeSingle();

    if (!church) {
      return NextResponse.json(
        { error: "Église introuvable." },
        { status: 404 }
      );
    }

    const payload = {
      church_id: churchId,
      module_code: moduleCode,
      enabled,
      enabled_by: profile.id,
      enabled_at: enabled ? new Date().toISOString() : null,
      disabled_at: enabled ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await admin
      .from("church_modules")
      .upsert(payload, {
        onConflict: "church_id,module_code",
      });

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      churchId,
      moduleCode,
      enabled,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur inattendue pendant la mise à jour." },
      { status: 500 }
    );
  }
}
