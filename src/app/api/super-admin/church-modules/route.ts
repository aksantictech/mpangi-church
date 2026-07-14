import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/access";
import {
  disableOptionalChurchModules,
  enableAllChurchModules,
  getChurchModulesForAdmin,
  setChurchModuleEnabled,
  syncChurchModules,
} from "@/lib/modules/moduleAdmin";

import { requireSuperAdminAccess } from "@/lib/security/sensitiveGuards";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireSuperAdminAccess();
  await requireSuperAdmin();

  const url = new URL(request.url);
  const churchId = url.searchParams.get("churchId");

  if (!churchId) {
    return NextResponse.json(
      { error: "churchId est obligatoire." },
      { status: 400 }
    );
  }

  const modules = await getChurchModulesForAdmin(churchId);

  return NextResponse.json({
    modules,
    enabledCount: modules.filter((module) => module.is_enabled).length,
    totalCount: modules.length,
  });
}

export async function POST(request: Request) {
  await requireSuperAdminAccess();
  await requireSuperAdmin();

  const body = await request.json();

  const churchId = String(body.churchId || "");
  const action = String(body.action || "");

  if (!churchId) {
    return NextResponse.json(
      { error: "churchId est obligatoire." },
      { status: 400 }
    );
  }

  if (action === "sync") {
    await syncChurchModules(churchId);
  } else if (action === "enable_all") {
    await enableAllChurchModules(churchId);
  } else if (action === "disable_optional") {
    await disableOptionalChurchModules(churchId);
  } else if (action === "set") {
    const moduleCode = String(body.moduleCode || "");
    const enabled = Boolean(body.enabled);

    if (!moduleCode) {
      return NextResponse.json(
        { error: "moduleCode est obligatoire." },
        { status: 400 }
      );
    }

    await setChurchModuleEnabled({
      churchId,
      moduleCode,
      enabled,
    });
  } else {
    return NextResponse.json(
      { error: "Action inconnue." },
      { status: 400 }
    );
  }

  const modules = await getChurchModulesForAdmin(churchId);

  return NextResponse.json({
    ok: true,
    modules,
    enabledCount: modules.filter((module) => module.is_enabled).length,
    totalCount: modules.length,
  });
}
