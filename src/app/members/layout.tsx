import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function MembersPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "members"
],
    "view"
  );

  return children;
}
