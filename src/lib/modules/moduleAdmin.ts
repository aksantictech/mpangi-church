import { createAdminClient } from "@/lib/supabase/admin";

export type AdminModuleRow = {
  code: string;
  name: string;
  category: string;
  description?: string | null;
  sort_order?: number | null;
  is_core?: boolean | null;
  is_active?: boolean | null;
  icon_name?: string | null;
  group_key?: string | null;
  is_enabled: boolean;
  enabled_at?: string | null;
};

export async function getChurchModulesForAdmin(churchId: string) {
  const admin = createAdminClient();

  await admin.rpc("sync_church_modules", {
    p_church_id: churchId,
  });

  const { data, error } = await admin
    .from("app_modules")
    .select(
      `
      code,
      name,
      category,
      description,
      sort_order,
      is_core,
      is_active,
      icon_name,
      group_key
    `
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: churchModules, error: churchModulesError } = await admin
    .from("church_modules")
    .select("module_code, is_enabled, enabled_at")
    .eq("church_id", churchId);

  if (churchModulesError) {
    throw new Error(churchModulesError.message);
  }

  const enabledMap = new Map(
    (churchModules ?? []).map((row: any) => [row.module_code, row])
  );

  return (data ?? []).map((module: any) => {
    const churchModule = enabledMap.get(module.code) as any;

    return {
      ...module,
      is_enabled: Boolean(churchModule?.is_enabled),
      enabled_at: churchModule?.enabled_at ?? null,
    } satisfies AdminModuleRow;
  });
}

export async function setChurchModuleEnabled({
  churchId,
  moduleCode,
  enabled,
}: {
  churchId: string;
  moduleCode: string;
  enabled: boolean;
}) {
  const admin = createAdminClient();

  await admin.rpc("sync_church_modules", {
    p_church_id: churchId,
  });

  const { error } = await admin
    .from("church_modules")
    .upsert(
      {
        church_id: churchId,
        module_code: moduleCode,
        is_enabled: enabled,
        enabled_at: enabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "church_id,module_code",
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  const { error: permissionError } = await admin
    .from("church_role_module_permissions")
    .update({
      can_view: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("church_id", churchId)
    .eq("module_code", moduleCode);

  if (permissionError) {
    throw new Error(permissionError.message);
  }
}

export async function enableAllChurchModules(churchId: string) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("enable_all_modules_for_church", {
    p_church_id: churchId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function disableOptionalChurchModules(churchId: string) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("disable_optional_modules_for_church", {
    p_church_id: churchId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncChurchModules(churchId: string) {
  const admin = createAdminClient();

  const { error } = await admin.rpc("sync_church_modules", {
    p_church_id: churchId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
