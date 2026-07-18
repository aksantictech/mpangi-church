export type ModuleCategoryCode =
  | "essentials"
  | "community"
  | "ministry"
  | "communication"
  | "administration"
  | "finance"
  | "resources"
  | "platform";

export type ModuleCategory = {
  code: ModuleCategoryCode;
  label: string;
  description: string;
  accent: string;
  order: number;
};

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    code: "essentials",
    label: "Essentiels",
    description: "Tableaux de bord et travail quotidien",
    accent: "from-blue-700 to-blue-500",
    order: 10,
  },
  {
    code: "community",
    label: "Communauté",
    description: "Membres, présences et accompagnement",
    accent: "from-emerald-700 to-emerald-500",
    order: 20,
  },
  {
    code: "ministry",
    label: "Ministère",
    description: "Départements, événements et enseignements",
    accent: "from-violet-700 to-violet-500",
    order: 30,
  },
  {
    code: "communication",
    label: "Communication",
    description: "Messages, publications et notifications",
    accent: "from-cyan-700 to-cyan-500",
    order: 40,
  },
  {
    code: "administration",
    label: "Administration",
    description: "Documents, tâches et transmissions",
    accent: "from-slate-700 to-slate-500",
    order: 50,
  },
  {
    code: "finance",
    label: "Finances",
    description: "Offrandes, dépenses, budgets et rapports",
    accent: "from-amber-700 to-orange-500",
    order: 60,
  },
  {
    code: "resources",
    label: "Ressources",
    description: "Patrimoine, maintenance et extensions",
    accent: "from-rose-700 to-pink-500",
    order: 70,
  },
  {
    code: "platform",
    label: "Configuration",
    description: "Utilisateurs, sécurité et paramètres",
    accent: "from-indigo-700 to-indigo-500",
    order: 80,
  },
];

const CATEGORY_BY_CODE = new Map(
  MODULE_CATEGORIES.map((category) => [category.code, category]),
);

const MODULE_CATEGORY: Record<string, ModuleCategoryCode> = {
  role_dashboard: "essentials",
  dashboard: "essentials",
  my_work: "essentials",

  members: "community",
  attendance: "community",
  souls: "community",
  public_requests: "community",

  departments: "ministry",
  events: "ministry",
  teachings: "ministry",
  appointments: "ministry",
  testimonies: "ministry",
  reports: "essentials",

  publications: "communication",
  notifications: "communication",
  correspondence: "communication",
  inbox: "communication",

  transmissions: "administration",
  tasks: "administration",
  minutes: "administration",
  administration: "administration",

  finance_dashboard: "finance",
  offerings: "finance",
  expenses: "finance",
  budgets: "finance",
  finance_reports: "finance",
  donations: "finance",

  patrimony: "resources",
  assets: "resources",
  maintenance: "resources",
  movements: "resources",
  extensions: "resources",

  users: "platform",
  security: "platform",
  settings: "platform",
};

const CATEGORY_ALIASES: Record<string, ModuleCategoryCode> = {
  general: "essentials",
  dashboard: "essentials",
  church: "community",
  people: "community",
  pastoral: "ministry",
  ministry: "ministry",
  communications: "communication",
  admin: "administration",
  finances: "finance",
  patrimony: "resources",
  system: "platform",
  configuration: "platform",
};

export function resolveModuleCategory(
  moduleCode: string,
  apiCategory?: string,
) {
  const normalizedApiCategory = String(apiCategory || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const categoryCode =
    (CATEGORY_BY_CODE.has(normalizedApiCategory as ModuleCategoryCode)
      ? (normalizedApiCategory as ModuleCategoryCode)
      : CATEGORY_ALIASES[normalizedApiCategory]) ||
    MODULE_CATEGORY[moduleCode] ||
    "platform";

  return CATEGORY_BY_CODE.get(categoryCode) || MODULE_CATEGORIES[0];
}
