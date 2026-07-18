import type {
  ModuleCode,
} from "@/lib/security/roleCatalog";
import type {
  PermissionAction,
} from "@/lib/security/permissionEngine";

export type RoutePermissionRule = {
  id: string;
  pattern: RegExp;
  modules: string[];
  action: PermissionAction;
  mode?: "any" | "all";
  public?: boolean;
};

export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
    {
    id: "reports",
    pattern: /^\/reports(?:\/|$)/,
    modules: [
      "attendance",
      "finance_reports",
      "financial_reports",
      "extension_reports",
      "extension_activities",
      "extensions",
      "donations",
      "offerings",
    ],
    action: "view",
    mode: "any",
  },
  {
    id: "members",
    pattern: /^\/members(?:\/|$)/,
    modules: ["members"],
    action: "view",
  },
  {
    id: "attendance",
    pattern: /^\/attendance(?:\/|$)/,
    modules: ["attendance"],
    action: "view",
  },
  {
    id: "souls",
    pattern: /^\/souls(?:\/|$)/,
    modules: ["souls"],
    action: "view",
  },
  {
    id: "departments",
    pattern: /^\/departments(?:\/|$)/,
    modules: ["departments"],
    action: "view",
  },
  {
    id: "events",
    pattern: /^\/events(?:\/|$)/,
    modules: ["events"],
    action: "view",
  },
  {
    id: "public-requests",
    pattern: /^\/public-requests(?:\/|$)/,
    modules: ["public_requests"],
    action: "view",
  },
  {
    id: "teachings",
    pattern: /^\/teachings(?:\/|$)/,
    modules: ["teachings"],
    action: "view",
  },
  {
    id: "notifications",
    pattern: /^\/notifications(?:\/|$)/,
    modules: ["notifications"],
    action: "view",
  },
  {
    id: "finance-donations",
    pattern: /^\/finance\/donations(?:\/|$)/,
    modules: ["donations"],
    action: "view",
  },
  {
    id: "finance-offerings",
    pattern: /^\/finance\/offerings(?:\/|$)/,
    modules: ["offerings"],
    action: "view",
  },
  {
    id: "finance-expenses",
    pattern: /^\/finance\/expenses(?:\/|$)/,
    modules: ["expenses"],
    action: "view",
  },
  {
    id: "finance-budgets",
    pattern: /^\/finance\/budgets(?:\/|$)/,
    modules: ["budgets"],
    action: "view",
  },
  {
    id: "finance-reports",
    pattern: /^\/finance\/reports(?:\/|$)/,
    modules: ["finance_reports", "financial_reports"],
    action: "view",
    mode: "any",
  },
  {
    id: "finance",
    pattern: /^\/finance(?:\/|$)/,
    modules: [
      "finance_dashboard",
      "offerings",
      "expenses",
      "budgets",
      "finance_reports",
      "financial_reports",
      "donations",
    ],
    action: "view",
    mode: "any",
  },
  {
    id: "patrimony-assets",
    pattern: /^\/patrimony\/assets(?:\/|$)/,
    modules: ["assets"],
    action: "view",
  },
  {
    id: "patrimony-maintenance",
    pattern: /^\/patrimony\/maintenance(?:\/|$)/,
    modules: ["maintenance", "asset_maintenance"],
    action: "view",
    mode: "any",
  },
  {
    id: "patrimony-movements",
    pattern: /^\/patrimony\/movements(?:\/|$)/,
    modules: ["movements", "asset_movements"],
    action: "view",
    mode: "any",
  },
  {
    id: "patrimony",
    pattern: /^\/patrimony(?:\/|$)/,
    modules: [
      "patrimony",
      "patrimony_dashboard",
      "assets",
      "maintenance",
      "asset_maintenance",
      "movements",
      "asset_movements",
    ],
    action: "view",
    mode: "any",
  },
  {
    id: "administration-correspondence",
    pattern: /^\/administration\/correspondence(?:\/|$)/,
    modules: ["correspondence"],
    action: "view",
  },
  {
    id: "administration-inbox",
    pattern: /^\/administration\/inbox(?:\/|$)/,
    modules: ["inbox", "document_transmissions"],
    action: "view",
    mode: "any",
  },
  {
    id: "administration-transmissions",
    pattern: /^\/administration\/transmissions(?:\/|$)/,
    modules: ["transmissions", "document_transmissions"],
    action: "view",
    mode: "any",
  },
  {
    id: "administration-tasks",
    pattern: /^\/administration\/tasks(?:\/|$)/,
    modules: ["tasks", "administrative_tasks"],
    action: "view",
    mode: "any",
  },
  {
    id: "administration-minutes",
    pattern: /^\/administration\/minutes(?:\/|$)/,
    modules: ["minutes", "meetings_minutes"],
    action: "view",
    mode: "any",
  },
  {
    id: "administration",
    pattern: /^\/administration(?:\/|$)/,
    modules: [
      "correspondence",
      "inbox",
      "document_transmissions",
      "transmissions",
      "tasks",
      "administrative_tasks",
      "minutes",
      "meetings_minutes",
    ],
    action: "view",
    mode: "any",
  },
  {
    id: "inbox",
    pattern: /^\/inbox(?:\/|$)/,
    modules: ["inbox", "document_transmissions"],
    action: "view",
    mode: "any",
  },
  {
    id: "extensions",
    pattern: /^\/extensions(?:\/|$)/,
    modules: [
      "extensions",
      "extension_activities",
      "extension_reports",
    ],
    action: "view",
    mode: "any",
  },
  {
    id: "settings-users",
    pattern: /^\/settings\/users(?:\/|$)/,
    modules: ["users"],
    action: "view",
  },
  {
    id: "settings-security-audit",
    pattern: /^\/settings\/security-audit(?:\/|$)/,
    modules: ["security"],
    action: "view",
  },
  {
    id: "settings-security-validation",
    pattern: /^\/settings\/security-validation(?:\/|$)/,
    modules: ["security"],
    action: "view",
  },
  {
    id: "settings-roles",
    pattern: /^\/settings\/roles(?:\/|$)/,
    modules: ["security"],
    action: "view",
  },
  {
    id: "role-dashboard",
    pattern: /^\/dashboard\/role(?:\/|$)/,
    modules: ["role_dashboard"],
    action: "view",
  },
  {
    id: "my-work",
    pattern: /^\/my-work(?:\/|$)/,
    modules: ["my_work"],
    action: "view",
  },
];

export function resolveRoutePermission(
  pathname: string
): RoutePermissionRule | null {
  return (
    ROUTE_PERMISSION_RULES.find((rule) =>
      rule.pattern.test(pathname)
    ) || null
  );
}

export function inferMutationAction(
  pathname: string
): PermissionAction {
  if (/\/new(?:\/|$)/.test(pathname)) return "create";
  if (/\/edit(?:\/|$)/.test(pathname)) return "update";

  return "view";
}

export function getPrimaryModuleCode(
  pathname: string
): ModuleCode | string | null {
  const rule = resolveRoutePermission(pathname);

  return rule?.modules[0] || null;
}
