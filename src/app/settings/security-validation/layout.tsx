import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function SecurityValidationLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    ["security"],
    "view"
  );

  return children;
}
