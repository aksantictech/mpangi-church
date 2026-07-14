import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function PublicRequestsPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "public_requests"
],
    "view"
  );

  return children;
}
