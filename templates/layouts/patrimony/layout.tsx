import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function PatrimonyPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "patrimony",
  "patrimony_dashboard",
  "assets",
  "maintenance",
  "asset_maintenance",
  "movements",
  "asset_movements"
],
    "view"
  );

  return children;
}
