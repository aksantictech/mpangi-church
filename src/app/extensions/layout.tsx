import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import ExtensionsModuleNav from "@/components/extensions/ExtensionsModuleNav";

import { requireAnyModulePermission } from "@/lib/security/routeGuard";
export default async function ExtensionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(["extensions", "extension_activities", "extension_reports"], "view");
  return (
    <AppShell>
      <div className="space-y-5 pb-24 md:pb-0">
        <ExtensionsModuleNav />
        {children}
      </div>
    </AppShell>
  );
}
