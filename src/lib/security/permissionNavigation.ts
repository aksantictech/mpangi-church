import {
  getCurrentRolePermissions,
  getCurrentSecurityContext,
} from "@/lib/security/permissionEngine";

export type PermissionNavigationItem = {
  code: string;
  label: string;
  href: string;
  category:
    | "principal"
    | "spirituel"
    | "administration"
    | "finance"
    | "patrimoine"
    | "configuration";
  aliases?: string[];
};

const NAVIGATION_ITEMS: PermissionNavigationItem[] = [
  {
    code: "role_dashboard",
    label: "Dashboard personnalisé",
    href: "/dashboard/role",
    category: "principal",
  },
  {
    code: "my_work",
    label: "Mon travail",
    href: "/my-work",
    category: "principal",
  },
  {
    code: "members",
    label: "Membres",
    href: "/members",
    category: "spirituel",
  },
  {
    code: "attendance",
    label: "Présences",
    href: "/attendance",
    category: "spirituel",
  },
  {
    code: "souls",
    label: "Suivi des âmes",
    href: "/souls",
    category: "spirituel",
  },
  {
    code: "departments",
    label: "Départements",
    href: "/departments",
    category: "spirituel",
  },
  {
    code: "events",
    label: "Événements",
    href: "/events",
    category: "spirituel",
  },
  {
    code: "public_requests",
    label: "Demandes publiques",
    href: "/public-requests",
    category: "spirituel",
  },
  {
    code: "teachings",
    label: "Enseignements",
    href: "/teachings",
    category: "spirituel",
  },
  {
    code: "notifications",
    label: "Notifications",
    href: "/notifications",
    category: "administration",
  },
  {
    code: "correspondence",
    label: "Courriers",
    href: "/administration/correspondence",
    category: "administration",
  },
  {
    code: "inbox",
    label: "Boîte de réception",
    href: "/inbox",
    category: "administration",
    aliases: ["document_transmissions"],
  },
  {
    code: "transmissions",
    label: "Transmissions",
    href: "/administration/transmissions",
    category: "administration",
    aliases: ["document_transmissions"],
  },
  {
    code: "tasks",
    label: "Tâches administratives",
    href: "/administration/tasks",
    category: "administration",
    aliases: ["administrative_tasks"],
  },
  {
    code: "minutes",
    label: "Procès-verbaux",
    href: "/administration/minutes",
    category: "administration",
    aliases: ["meetings_minutes"],
  },
  {
    code: "finance_dashboard",
    label: "Finances",
    href: "/finance",
    category: "finance",
  },
  {
    code: "offerings",
    label: "Offrandes",
    href: "/finance/offerings",
    category: "finance",
  },
  {
    code: "expenses",
    label: "Dépenses",
    href: "/finance/expenses",
    category: "finance",
  },
  {
    code: "budgets",
    label: "Budgets",
    href: "/finance/budgets",
    category: "finance",
  },
  {
    code: "finance_reports",
    label: "Rapports financiers",
    href: "/finance/reports",
    category: "finance",
    aliases: ["financial_reports"],
  },
  {
    code: "donations",
    label: "Dons reçus",
    href: "/finance/donations",
    category: "finance",
  },
  {
    code: "patrimony",
    label: "Patrimoine",
    href: "/patrimony",
    category: "patrimoine",
    aliases: ["patrimony_dashboard"],
  },
  {
    code: "assets",
    label: "Biens",
    href: "/patrimony/assets",
    category: "patrimoine",
  },
  {
    code: "maintenance",
    label: "Maintenance",
    href: "/patrimony/maintenance",
    category: "patrimoine",
    aliases: ["asset_maintenance"],
  },
  {
    code: "movements",
    label: "Mouvements",
    href: "/patrimony/movements",
    category: "patrimoine",
    aliases: ["asset_movements"],
  },
  {
    code: "extensions",
    label: "Extensions",
    href: "/extensions",
    category: "spirituel",
    aliases: [
      "extension_activities",
      "extension_reports",
    ],
  },
  {
    code: "users",
    label: "Utilisateurs",
    href: "/settings/users",
    category: "configuration",
  },
  {
    code: "security",
    label: "Rôles et accès",
    href: "/settings/roles",
    category: "configuration",
  },
  {
    code: "security",
    label: "Journal sécurité",
    href: "/settings/security-audit",
    category: "configuration",
  },
];

export async function getAllowedNavigationItems() {
  const [context, permissions] = await Promise.all([
    getCurrentSecurityContext(),
    getCurrentRolePermissions(),
  ]);

  if (context.role === "super_admin") {
    return {
      context,
      items: NAVIGATION_ITEMS,
    };
  }

  const visibleCodes = new Set(
    permissions
      .filter(
        (permission) =>
          permission.is_enabled &&
          permission.can_view
      )
      .map((permission) => permission.module_code)
  );

  const items = NAVIGATION_ITEMS.filter((item) => {
    if (visibleCodes.has(item.code)) return true;

    return (item.aliases || []).some((alias) =>
      visibleCodes.has(alias)
    );
  });

  return {
    context,
    items,
  };
}

export function groupPermissionNavigation(
  items: PermissionNavigationItem[]
) {
  return items.reduce(
    (
      groups: Record<
        PermissionNavigationItem["category"],
        PermissionNavigationItem[]
      >,
      item
    ) => {
      groups[item.category].push(item);
      return groups;
    },
    {
      principal: [],
      spirituel: [],
      administration: [],
      finance: [],
      patrimoine: [],
      configuration: [],
    }
  );
}
