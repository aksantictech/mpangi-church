export type ModuleCategory =
  | "system"
  | "spiritual"
  | "administration"
  | "finance"
  | "patrimony";

export type ModuleMenuItem = {
  code: string;
  title: string;
  description: string;
  href: string;
  category: ModuleCategory;
  iconKey: string;
  sortOrder: number;
  activePaths?: string[];
};

export type ModuleMenuGroup = {
  category: ModuleCategory;
  title: string;
  description: string;
  sortOrder: number;
  items: ModuleMenuItem[];
};

export const MODULE_MENU_ITEMS: ModuleMenuItem[] = [
  {
    code: "dashboard",
    title: "Dashboard",
    description: "Vue générale de l’église",
    href: "/dashboard",
    category: "system",
    iconKey: "Home",
    sortOrder: 1,
  },
  {
    code: "members",
    title: "Membres",
    description: "Liste, fiches, QR Codes, cartes et import Excel",
    href: "/members",
    category: "spiritual",
    iconKey: "Users",
    sortOrder: 10,
  },
  {
    code: "attendance",
    title: "Présences",
    description: "Pointage manuel, rapports et scanner QR",
    href: "/attendance",
    category: "spiritual",
    iconKey: "CalendarCheck",
    sortOrder: 20,
    activePaths: ["/attendance", "/attendance/reports"],
  },
  {
    code: "attendance",
    title: "Scanner QR",
    description: "Scanner rapidement les présences par QR Code",
    href: "/attendance/scanner",
    category: "spiritual",
    iconKey: "ScanLine",
    sortOrder: 21,
    activePaths: ["/attendance/scanner"],
  },
  {
    code: "souls",
    title: "Suivi des âmes",
    description: "Accompagnement pastoral",
    href: "/souls",
    category: "spiritual",
    iconKey: "HeartHandshake",
    sortOrder: 30,
  },
  {
    code: "departments",
    title: "Départements",
    description: "Services, ministères et affectations",
    href: "/departments",
    category: "spiritual",
    iconKey: "Building2",
    sortOrder: 40,
  },
  {
    code: "events",
    title: "Événements",
    description: "Cultes, programmes et activités",
    href: "/events",
    category: "spiritual",
    iconKey: "CalendarDays",
    sortOrder: 50,
  },
  {
    code: "publications",
    title: "Publications",
    description: "Enseignements, vidéos, messages et annonces",
    href: "/publications",
    category: "spiritual",
    iconKey: "BookOpenText",
    sortOrder: 60,
  },
  {
    code: "public_requests",
    title: "Demandes publiques",
    description: "Prières, rendez-vous, intégrations",
    href: "/public-requests",
    category: "spiritual",
    iconKey: "MessageSquareText",
    sortOrder: 70,
  },
  {
    code: "appointments",
    title: "Rendez-vous",
    description: "Gestion des rendez-vous pastoraux",
    href: "/appointments",
    category: "spiritual",
    iconKey: "Church",
    sortOrder: 80,
  },
  {
    code: "testimonies",
    title: "Témoignages",
    description: "Gestion des témoignages reçus",
    href: "/testimonies",
    category: "spiritual",
    iconKey: "TestTube2",
    sortOrder: 90,
  },
  {
    code: "notifications",
    title: "Notifications",
    description: "Annonces push et historique d’envoi",
    href: "/notifications",
    category: "system",
    iconKey: "Bell",
    sortOrder: 100,
  },

  {
    code: "correspondence",
    title: "Courriers",
    description: "Courriers entrants, sortants et internes",
    href: "/administration/correspondence",
    category: "administration",
    iconKey: "Inbox",
    sortOrder: 200,
  },
  {
    code: "document_transmissions",
    title: "Transmission documents",
    description: "Transmission interne, suivi et accusés de réception",
    href: "/administration/transmissions",
    category: "administration",
    iconKey: "FileText",
    sortOrder: 210,
  },
  {
    code: "administrative_tasks",
    title: "Tâches administratives",
    description: "Tâches, délais et responsabilités internes",
    href: "/administration/tasks",
    category: "administration",
    iconKey: "ClipboardCheck",
    sortOrder: 220,
  },
  {
    code: "meetings_minutes",
    title: "PV et réunions",
    description: "Procès-verbaux, réunions et décisions",
    href: "/administration/minutes",
    category: "administration",
    iconKey: "ScrollText",
    sortOrder: 230,
  },

  {
    code: "finance_dashboard",
    title: "Dashboard finances",
    description: "Vue financière globale",
    href: "/finance",
    category: "finance",
    iconKey: "Wallet",
    sortOrder: 300,
  },
  {
    code: "offerings",
    title: "Offrandes et dîmes",
    description: "Entrées : offrandes, dîmes, dons et cotisations",
    href: "/finance/offerings",
    category: "finance",
    iconKey: "HandCoins",
    sortOrder: 310,
  },
  {
    code: "expenses",
    title: "Dépenses",
    description: "Dépenses, justificatifs et validations",
    href: "/finance/expenses",
    category: "finance",
    iconKey: "ReceiptText",
    sortOrder: 320,
  },
  {
    code: "budgets",
    title: "Budgets",
    description: "Budgets par période, activité ou département",
    href: "/finance/budgets",
    category: "finance",
    iconKey: "PieChart",
    sortOrder: 330,
  },
  {
    code: "financial_reports",
    title: "Rapports financiers",
    description: "Exports et synthèses financières",
    href: "/finance/reports",
    category: "finance",
    iconKey: "BarChart3",
    sortOrder: 340,
  },

  {
    code: "patrimony_dashboard",
    title: "Dashboard patrimoine",
    description: "Vue globale du patrimoine",
    href: "/patrimony",
    category: "patrimony",
    iconKey: "Warehouse",
    sortOrder: 400,
  },
  {
    code: "assets",
    title: "Biens et patrimoine",
    description: "Inventaire des biens, matériels, véhicules et bâtiments",
    href: "/patrimony/assets",
    category: "patrimony",
    iconKey: "PackageCheck",
    sortOrder: 410,
  },
  {
    code: "asset_maintenance",
    title: "Maintenance patrimoine",
    description: "Réparations, maintenance et suivi des biens",
    href: "/patrimony/maintenance",
    category: "patrimony",
    iconKey: "Wrench",
    sortOrder: 420,
  },
  {
    code: "asset_movements",
    title: "Mouvements patrimoine",
    description: "Affectations, sorties, retours et pertes",
    href: "/patrimony/movements",
    category: "patrimony",
    iconKey: "ArrowLeftRight",
    sortOrder: 430,
  },

  {
    code: "install",
    title: "Installer l’application",
    description: "Ajouter Mpangi-church sur le téléphone",
    href: "/install",
    category: "system",
    iconKey: "Download",
    sortOrder: 900,
  },
  {
    code: "public_page_settings",
    title: "Page publique",
    description: "Nom public, dons, contacts et YouTube",
    href: "/settings/public-page",
    category: "system",
    iconKey: "Globe",
    sortOrder: 910,
  },
  {
    code: "member_registration_settings",
    title: "QR ajout membre",
    description: "Lien public et QR Code d’ajout membre",
    href: "/settings/member-registration",
    category: "system",
    iconKey: "QrCode",
    sortOrder: 920,
  },
  {
    code: "settings",
    title: "Paramètres",
    description: "Compte, église et configuration",
    href: "/settings",
    category: "system",
    iconKey: "Settings",
    sortOrder: 930,
  },
];

const FALLBACK_CODES = new Set([
  "dashboard",
  "members",
  "attendance",
  "souls",
  "departments",
  "events",
  "publications",
  "public_requests",
  "appointments",
  "testimonies",
  "notifications",
  "install",
  "public_page_settings",
  "member_registration_settings",
  "settings",
]);

const ALWAYS_VISIBLE_CODES = new Set([
  "dashboard",
  "install",
  "public_page_settings",
  "member_registration_settings",
  "settings",
]);

const GROUP_META: Record<
  ModuleCategory,
  { title: string; description: string; sortOrder: number }
> = {
  system: {
    title: "Général",
    description: "Accès global, installation, notifications et paramètres",
    sortOrder: 1,
  },
  spiritual: {
    title: "Volet spirituel",
    description: "Vie pastorale, membres, présences et activités spirituelles",
    sortOrder: 10,
  },
  administration: {
    title: "Volet administratif",
    description: "Courriers, documents, transmissions internes et tâches",
    sortOrder: 20,
  },
  finance: {
    title: "Volet finances",
    description: "Entrées, dépenses, budgets et rapports financiers",
    sortOrder: 30,
  },
  patrimony: {
    title: "Volet patrimoine",
    description: "Biens, inventaire, maintenance et affectations",
    sortOrder: 40,
  },
};

export function getVisibleMenuItems(moduleCodes: string[]) {
  const enabledCodes = moduleCodes.length > 0 ? new Set(moduleCodes) : FALLBACK_CODES;

  return MODULE_MENU_ITEMS.filter((item) => {
    if (ALWAYS_VISIBLE_CODES.has(item.code)) return true;
    return enabledCodes.has(item.code);
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGroupedVisibleMenuItems(moduleCodes: string[]) {
  const visibleItems = getVisibleMenuItems(moduleCodes);
  const groupsMap = new Map<ModuleCategory, ModuleMenuItem[]>();

  for (const item of visibleItems) {
    const existing = groupsMap.get(item.category) ?? [];
    existing.push(item);
    groupsMap.set(item.category, existing);
  }

  return Array.from(groupsMap.entries())
    .map(([category, items]) => ({
      category,
      title: GROUP_META[category].title,
      description: GROUP_META[category].description,
      sortOrder: GROUP_META[category].sortOrder,
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
