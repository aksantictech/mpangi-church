import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartHandshake,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  PackageCheck,
  PieChart,
  QrCode,
  ReceiptText,
  Settings,
  Smartphone,
  UsersRound,
  Wallet,
  Warehouse,
  Wrench,
  ArrowLeftRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModuleCategory =
  | "system"
  | "spiritual"
  | "administration"
  | "finance"
  | "patrimony";

export type ModuleMenuItem = {
  code: string;
  label: string;
  href: string;
  icon: LucideIcon;
  category: ModuleCategory;
  alwaysVisible?: boolean;
};

export type ModuleMenuGroup = {
  key: ModuleCategory;
  title: string;
  description: string;
  icon: LucideIcon;
  items: ModuleMenuItem[];
};

export const MODULE_CATEGORY_META: Record<
  ModuleCategory,
  { title: string; description: string; icon: LucideIcon }
> = {
  system: {
    title: "Général",
    description: "Accueil, paramètres et accès rapides",
    icon: Settings,
  },
  spiritual: {
    title: "Volet spirituel",
    description: "Membres, présences, âmes et vie spirituelle",
    icon: HeartHandshake,
  },
  administration: {
    title: "Volet administratif",
    description: "Courriers, transmissions, tâches et PV",
    icon: Inbox,
  },
  finance: {
    title: "Volet finances",
    description: "Entrées, dépenses, budgets et rapports",
    icon: Wallet,
  },
  patrimony: {
    title: "Volet patrimoine",
    description: "Inventaire, maintenance et mouvements",
    icon: Warehouse,
  },
};

export const MODULE_MENU_ITEMS: ModuleMenuItem[] = [
  {
    code: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    category: "system",
    alwaysVisible: true,
  },
  {
    code: "notifications",
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    category: "system",
  },
  {
    code: "pwa_install",
    label: "Installer l’application",
    href: "/install",
    icon: Smartphone,
    category: "system",
    alwaysVisible: true,
  },
  {
    code: "public_page",
    label: "Page publique",
    href: "/public-preview",
    icon: Megaphone,
    category: "system",
  },
  {
    code: "member_qr",
    label: "QR ajout membre",
    href: "/members/qr",
    icon: QrCode,
    category: "system",
  },
  {
    code: "settings",
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
    category: "system",
    alwaysVisible: true,
  },

  {
    code: "members",
    label: "Membres",
    href: "/members",
    icon: UsersRound,
    category: "spiritual",
  },
  {
    code: "attendance",
    label: "Présences",
    href: "/attendance",
    icon: QrCode,
    category: "spiritual",
  },
  {
    code: "souls",
    label: "Suivi des âmes",
    href: "/souls",
    icon: HeartHandshake,
    category: "spiritual",
  },
  {
    code: "departments",
    label: "Départements",
    href: "/departments",
    icon: Home,
    category: "spiritual",
  },
  {
    code: "events",
    label: "Événements",
    href: "/events",
    icon: CalendarDays,
    category: "spiritual",
  },
  {
    code: "publications",
    label: "Publications",
    href: "/publications",
    icon: Megaphone,
    category: "spiritual",
  },
  {
    code: "appointments",
    label: "Rendez-vous",
    href: "/appointments",
    icon: CalendarDays,
    category: "spiritual",
  },
  {
    code: "testimonies",
    label: "Témoignages",
    href: "/testimonies",
    icon: HeartHandshake,
    category: "spiritual",
  },

  {
    code: "correspondence",
    label: "Courriers",
    href: "/administration/correspondence",
    icon: FileText,
    category: "administration",
  },
  {
    code: "document_transmissions",
    label: "Transmissions",
    href: "/administration/transmissions",
    icon: Inbox,
    category: "administration",
  },
  {
    code: "administrative_tasks",
    label: "Tâches administratives",
    href: "/administration/tasks",
    icon: ListChecks,
    category: "administration",
  },
  {
    code: "meetings_minutes",
    label: "PV et réunions",
    href: "/administration/minutes",
    icon: ClipboardList,
    category: "administration",
  },

  {
    code: "finance_dashboard",
    label: "Dashboard finances",
    href: "/finance",
    icon: Wallet,
    category: "finance",
  },
  {
    code: "offerings",
    label: "Entrées / offrandes",
    href: "/finance/offerings",
    icon: ReceiptText,
    category: "finance",
  },
  {
    code: "expenses",
    label: "Dépenses",
    href: "/finance/expenses",
    icon: Landmark,
    category: "finance",
  },
  {
    code: "budgets",
    label: "Budgets",
    href: "/finance/budgets",
    icon: PieChart,
    category: "finance",
  },
  {
    code: "financial_reports",
    label: "Rapports financiers",
    href: "/finance/reports",
    icon: FileText,
    category: "finance",
  },

  {
    code: "patrimony_dashboard",
    label: "Dashboard patrimoine",
    href: "/patrimony",
    icon: Warehouse,
    category: "patrimony",
  },
  {
    code: "assets",
    label: "Biens / inventaire",
    href: "/patrimony/assets",
    icon: PackageCheck,
    category: "patrimony",
  },
  {
    code: "asset_maintenance",
    label: "Maintenance",
    href: "/patrimony/maintenance",
    icon: Wrench,
    category: "patrimony",
  },
  {
    code: "asset_movements",
    label: "Mouvements",
    href: "/patrimony/movements",
    icon: ArrowLeftRight,
    category: "patrimony",
  },
];

const CATEGORY_ORDER: ModuleCategory[] = [
  "system",
  "spiritual",
  "administration",
  "finance",
  "patrimony",
];

export function getGroupedVisibleMenuItems(moduleCodes: string[]) {
  const visibleCodes = new Set(moduleCodes);

  const visibleItems = MODULE_MENU_ITEMS.filter(
    (item) => item.alwaysVisible || visibleCodes.has(item.code)
  );

  return CATEGORY_ORDER.map((category) => ({
    key: category,
    title: MODULE_CATEGORY_META[category].title,
    description: MODULE_CATEGORY_META[category].description,
    icon: MODULE_CATEGORY_META[category].icon,
    items: visibleItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}
