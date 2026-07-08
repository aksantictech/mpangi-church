import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import MobileModuleAccordion from "@/components/modules/MobileModuleAccordion";
import { getGroupedVisibleMenuItems } from "@/lib/modules/moduleRegistry";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersRound } from "lucide-react";

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
  "pasteur",
  "pastor",
]);

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

  const { data: moduleResponse } = await supabase.auth.getUser();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/modules/my-modules`,
    { cache: "no-store" }
  ).catch(() => null);

  let moduleCodes = ["dashboard"];

  if (response?.ok) {
    const payload = await response.json();
    moduleCodes = payload.moduleCodes || ["dashboard"];
  } else if (profile.church_id) {
    const { data: enabledRows } = await admin
      .from("church_modules")
      .select("module_code")
      .eq("church_id", profile.church_id)
      .eq("enabled", true);

    moduleCodes = ["dashboard", ...((enabledRows ?? []).map((row: any) => row.module_code))];
  }

  let groups = getGroupedVisibleMenuItems(moduleCodes);
  const role = String(profile.role || "").toLowerCase();

  if (ADMIN_ROLES.has(role)) {
    groups = groups.map((group) => {
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

  return (
    <AppShell>
      <div className="space-y-6 lg:hidden">
        <section className="rounded-3xl bg-gradient-to-br from-[#03357A] via-[#2563EB] to-[#8B5CF6] p-6 text-white shadow-lg shadow-blue-900/20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Mpangi-church
          </p>
          <h1 className="mt-3 text-3xl font-extrabold">Menu mobile</h1>
          <p className="mt-2 text-sm leading-7 text-blue-50">
            Accès rapide aux volets autorisés pour votre compte.
          </p>
        </section>

        <MobileModuleAccordion groups={groups} />
      </div>
    </AppShell>
  );
}
