import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function SecurityAuditLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(["security"], "view");
  return children;
}
