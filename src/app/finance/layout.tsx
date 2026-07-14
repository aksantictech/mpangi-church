import type { ReactNode } from "react";
import { requireAnyModulePermission } from "@/lib/security/routeGuard";

export default async function FinancePermissionLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAnyModulePermission(
    [
  "finance_dashboard",
  "offerings",
  "expenses",
  "budgets",
  "finance_reports",
  "financial_reports",
  "donations"
],
    "view"
  );

  return children;
}
