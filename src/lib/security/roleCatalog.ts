export const ROLE_CATALOG = [
  {
    code: "super_admin",
    label: "Super administrateur",
    description: "Gestion globale de toutes les églises.",
  },
  {
    code: "church_admin",
    label: "Administrateur église",
    description: "Administration générale de son église.",
  },
  {
    code: "pasteur_t",
    label: "Pasteur titulaire",
    description: "Pilotage pastoral et validation.",
  },
  {
    code: "pasteur_a",
    label: "Pasteur assistant",
    description: "Suivi pastoral et activités confiées.",
  },
  {
    code: "charge_afp",
    label: "Chargé AFP",
    description: "Administration, finances et patrimoine.",
  },
  {
    code: "responsable_d",
    label: "Responsable de département",
    description: "Gestion du département qui lui est confié.",
  },
  {
    code: "logisticien",
    label: "Logisticien",
    description: "Patrimoine, mouvements et maintenance.",
  },
  {
    code: "secretaire",
    label: "Secrétaire",
    description: "Courriers, transmissions et procès-verbaux.",
  },
  {
    code: "worker",
    label: "Ouvrier",
    description: "Exécution des tâches et activités attribuées.",
  },
  {
    code: "readonly",
    label: "Lecture seule",
    description: "Consultation sans modification.",
  },
  {
    code: "member",
    label: "Membre",
    description: "Accès personnel limité.",
  },
] as const;

export const MODULE_CATALOG = [
  ["role_dashboard", "Dashboard personnalisé", "/dashboard/role"],
  ["my_work", "Mon travail", "/my-work"],
  ["members", "Membres", "/members"],
  ["attendance", "Présences", "/attendance"],
  ["souls", "Suivi des âmes", "/souls"],
  ["departments", "Départements", "/departments"],
  ["events", "Événements", "/events"],
  ["public_requests", "Demandes publiques", "/public-requests"],
  ["publications", "Publications", "/publications"],
  ["teachings", "Enseignements", "/teachings"],
  ["notifications", "Notifications", "/notifications"],

  ["correspondence", "Courriers / correspondance", "/administration/correspondence"],
  ["document_transmissions", "Boîte de réception / Transmissions", "/administration/transmissions"],
  ["administrative_tasks", "Tâches administratives", "/administration/tasks"],
  ["meetings_minutes", "Procès-verbaux", "/administration/minutes"],

  ["finance_dashboard", "Dashboard finances", "/finance"],
  ["offerings", "Offrandes", "/finance/offerings"],
  ["expenses", "Dépenses", "/finance/expenses"],
  ["budgets", "Budgets", "/finance/budgets"],
  ["financial_reports", "Rapports financiers", "/finance/reports"],
  ["donations", "Dons reçus", "/finance/donations"],

  ["patrimony_dashboard", "Dashboard patrimoine", "/patrimony"],
  ["assets", "Biens", "/patrimony/assets"],
  ["asset_maintenance", "Maintenance", "/patrimony/maintenance"],
  ["asset_movements", "Mouvements", "/patrimony/movements"],

  ["extension_activities", "Extensions", "/extensions"],

  ["settings", "Paramètres", "/settings"],
  ["users", "Utilisateurs", "/settings/users"],
  ["security", "Rôles et accès", "/settings/roles"],
] as const;

const MODULE_ALIASES: Record<string, string> = {
  inbox: "document_transmissions",
  transmission: "document_transmissions",
  transmissions: "document_transmissions",
  document_transmissions: "document_transmissions",

  tasks: "administrative_tasks",
  administrative_tasks: "administrative_tasks",

  minutes: "meetings_minutes",
  meetings_minutes: "meetings_minutes",

  finance_reports: "financial_reports",
  financial_reports: "financial_reports",

  patrimony: "patrimony_dashboard",
  patrimony_dashboard: "patrimony_dashboard",

  maintenance: "asset_maintenance",
  asset_maintenance: "asset_maintenance",

  movements: "asset_movements",
  asset_movements: "asset_movements",

  extensions: "extension_activities",
  extension_reports: "extension_activities",
  extension_activities: "extension_activities",
};

export function normalizeModuleCode(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return MODULE_ALIASES[normalized] || normalized;
}

export type RoleCode = (typeof ROLE_CATALOG)[number]["code"];
export type ModuleCode = (typeof MODULE_CATALOG)[number][0];

const ROLE_ALIASES: Record<string, RoleCode> = {
  admin: "church_admin",
  administrator: "church_admin",
  admin_eglise: "church_admin",
  church_admin: "church_admin",
  owner: "church_admin",

  pastor_titulaire: "pasteur_t",
  pasteur_titulaire: "pasteur_t",
  pastor: "pasteur_t",
  pasteur: "pasteur_t",
  pasteur_t: "pasteur_t",

  pastor_assistant: "pasteur_a",
  assistant_pastor: "pasteur_a",
  pasteur_assistant: "pasteur_a",
  pasteur_a: "pasteur_a",

  afp_manager: "charge_afp",
  finance_manager: "charge_afp",
  administration_manager: "charge_afp",
  charge_afp: "charge_afp",

  responsable_d: "responsable_d",
  department_leader: "responsable_d",
  department_manager: "responsable_d",

  logistician: "logisticien",
  patrimony_manager: "logisticien",
  logisticien: "logisticien",

  secretary: "secretaire",
  secretaire: "secretaire",

  worker: "worker",
  church_worker: "worker",
  ouvrier: "worker",

  readonly: "readonly",
  viewer: "readonly",

  member: "member",
  super_admin: "super_admin",
};

export function normalizeRoleCode(value: unknown): RoleCode {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return ROLE_ALIASES[normalized] || "readonly";
}

export function getRoleLabel(value: unknown) {
  const code = normalizeRoleCode(value);

  return ROLE_CATALOG.find((role) => role.code === code)?.label || code;
}

export function getModuleDefinition(moduleCode: string) {
  const moduleDefinition = MODULE_CATALOG.find(
    ([code]) => code === moduleCode
  );

  if (!moduleDefinition) return null;

  return {
    code: moduleDefinition[0],
    label: moduleDefinition[1],
    href: moduleDefinition[2],
  };
}
