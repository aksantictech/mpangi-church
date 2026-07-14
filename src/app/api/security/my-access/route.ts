import { NextResponse } from "next/server";
import { getSecurityContext } from "@/lib/security/access";

import { requireAuthenticatedAccess } from "@/lib/security/sensitiveGuards";
export async function GET() {
  await requireAuthenticatedAccess();
  const context = await getSecurityContext();

  if (!context) {
    return NextResponse.json(
      { error: "Utilisateur non connecté." },
      { status: 401 }
    );
  }

  const { admin, profile, role, churchId } = context;

  if (role === "super_admin") {
    return NextResponse.json({
      profile,
      role,
      churchId,
      modules: [],
      source: "super_admin",
    });
  }

  if (!churchId) {
    return NextResponse.json({
      profile,
      role,
      churchId: null,
      modules: [],
    });
  }

  const [{ data: enabledModules }, { data: explicitPermissions }, { data: rolePermissions }] =
    await Promise.all([
      admin
        .from("church_modules")
        .select("module_code, enabled, module:app_modules(code, name, category)")
        .eq("church_id", churchId)
        .eq("enabled", true),

      admin
        .from("profile_module_permissions")
        .select("*")
        .eq("church_id", churchId)
        .eq("profile_id", profile.id),

      admin
        .from("church_role_module_permissions")
        .select("*")
        .eq("church_id", churchId)
        .eq("role", role),
    ]);

  return NextResponse.json({
    profile,
    role,
    churchId,
    hasCustomPermissions: (explicitPermissions ?? []).length > 0,
    enabledModules: enabledModules ?? [],
    explicitPermissions: explicitPermissions ?? [],
    rolePermissions: rolePermissions ?? [],
  });
}
