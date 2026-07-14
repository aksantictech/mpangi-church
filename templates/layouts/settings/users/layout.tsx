import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function UsersPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    ["users"],
    "view"
  );

  return children;
}
