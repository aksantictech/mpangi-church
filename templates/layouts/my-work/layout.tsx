import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function MyWorkPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    ["my_work"],
    "view"
  );

  return children;
}
