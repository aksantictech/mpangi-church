import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import MobileModuleAccordion from "@/components/modules/MobileModuleAccordion";
import {
  getGroupedVisibleMenuItems,
} from "@/lib/modules/moduleRegistry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MobileMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, church_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  if (profile.status && profile.status !== "active") redirect("/login");

  if (profile.role === "super_admin") redirect("/super-admin/dashboard");

  const admin = createAdminClient();

  let moduleCodes = ["dashboard"];

  if (profile.church_id) {
    const { data: enabledRows } = await admin
      .from("church_modules")
      .select("module_code")
      .eq("church_id", profile.church_id)
      .eq("enabled", true);

    const enabledCodes = new Set((enabledRows ?? []).map((row: any) => row.module_code));

    const { data: explicitPermissions } = await admin
      .from("profile_module_permissions")
      .select("module_code, can_view")
      .eq("church_id", profile.church_id)
      .eq("profile_id", profile.id);

    let permissions = explicitPermissions ?? [];
    if (permissions.length === 0) {
      const { data: rolePermissions } = await admin
        .from("church_role_module_permissions")
        .select("module_code, can_view")
        .eq("church_id", profile.church_id)
        .eq("role_code", profile.role);
      permissions = rolePermissions ?? [];
    }

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
    moduleCodes = [
      "dashboard",
      ...permissions
        .filter((permission: any) => permission.can_view)
        .map((permission: any) => permission.module_code)
        .filter((code: string) => systemCodes.has(code) || enabledCodes.has(code)),
    ];
  }

  const groups = getGroupedVisibleMenuItems(Array.from(new Set(moduleCodes)));

  return (
    <AppShell>
      <div className="space-y-5 lg:hidden">
        <section className="rounded-[1.7rem] bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Menu</h1>
          <p className="mt-2 text-sm leading-7 text-blue-50">
            Accès rapide aux volets autorisés pour votre compte.
          </p>
        </section>

        <MobileModuleAccordion groups={groups} />
      </div>
    </AppShell>
  );
}
