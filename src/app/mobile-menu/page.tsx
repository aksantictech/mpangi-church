import { redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import MobileModuleAccordion from "@/components/modules/MobileModuleAccordion";
import {
  getGroupedVisibleMenuItems,
  type ModuleMenuGroup,
} from "@/lib/modules/moduleRegistry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

const FULL_ACCESS_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

function addAdminUserPermissionItem(groups: ModuleMenuGroup[], role: string) {
  if (!ADMIN_ROLES.has(role)) return groups;

  return groups.map((group) => {
    if (group.key !== "system") return group;

    const exists = group.items.some((item) => item.href === "/settings/users");
    if (exists) return group;

    return {
      ...group,
      items: [
        ...group.items,
        {
          code: "user_permissions",
          label: "Utilisateurs & rôles",
          href: "/settings/users",
          icon: UsersRound,
          category: "system" as const,
        },
      ],
    };
  });
}

function fallbackCanView(role: string, moduleCode: string) {
  if (FULL_ACCESS_ROLES.has(role)) return true;

  if (role === "administration_manager") {
    return [
      "dashboard",
      "notifications",
      "correspondence",
      "document_transmissions",
      "administrative_tasks",
      "meetings_minutes",
    ].includes(moduleCode);
  }

  if (role === "finance_manager") {
    return [
      "dashboard",
      "notifications",
      "finance_dashboard",
      "offerings",
      "expenses",
      "budgets",
      "financial_reports",
    ].includes(moduleCode);
  }

  if (role === "patrimony_manager") {
    return [
      "dashboard",
      "notifications",
      "patrimony_dashboard",
      "assets",
      "asset_maintenance",
      "asset_movements",
    ].includes(moduleCode);
  }

  return ["dashboard", "members", "attendance", "souls", "events"].includes(moduleCode);
}

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

  const role = String(profile.role || "").toLowerCase();
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

    if ((explicitPermissions ?? []).length > 0) {
      moduleCodes = [
        "dashboard",
        ...((explicitPermissions ?? [])
          .filter((permission: any) => permission.can_view)
          .map((permission: any) => permission.module_code)
          .filter((code: string) => enabledCodes.has(code))),
      ];
    } else {
      moduleCodes = [
        "dashboard",
        ...Array.from(enabledCodes).filter((code) => fallbackCanView(role, code)),
      ];
    }
  }

  const groups = addAdminUserPermissionItem(
    getGroupedVisibleMenuItems(Array.from(new Set(moduleCodes))),
    role
  );

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
