import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function ExtensionsPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "extensions",
  "extension_activities",
  "extension_reports"
],
    "view"
  );

  return children;
}
