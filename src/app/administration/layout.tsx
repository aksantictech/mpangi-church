import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function AdministrationPermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "correspondence",
  "inbox",
  "document_transmissions",
  "transmissions",
  "tasks",
  "administrative_tasks",
  "minutes",
  "meetings_minutes"
],
    "view"
  );

  return children;
}
