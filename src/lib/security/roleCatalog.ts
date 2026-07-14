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
    code: "admin_eglise",
    label: "Administrateur église",
    description: "Alias historique du rôle administrateur.",
  },
  {
    code: "pasteur_t",
    label: "Pasteur titulaire",
    description: "Pilotage pastoral et validation.",
  },
  {
    code: "pastor",
    label: "Pasteur",
    description: "Alias historique du rôle pasteur.",
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
    description: "Gestion d’un département et de ses activités.",
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
  ["correspondence", "Courriers", "/administration/correspondence"],
  ["inbox", "Boîte de réception", "/inbox"],
  ["transmissions", "Transmissions", "/administration/transmissions"],
  ["tasks", "Tâches administratives", "/administration/tasks"],
  ["minutes", "Procès-verbaux", "/administration/minutes"],
  ["finance_dashboard", "Dashboard finances", "/finance"],
  ["offerings", "Offrandes", "/finance/offerings"],
  ["expenses", "Dépenses", "/finance/expenses"],
  ["budgets", "Budgets", "/finance/budgets"],
  ["finance_reports", "Rapports financiers", "/finance/reports"],
  ["donations", "Dons reçus", "/finance/donations"],
  ["patrimony", "Dashboard patrimoine", "/patrimony"],
  ["assets", "Biens", "/patrimony/assets"],
  ["maintenance", "Maintenance", "/patrimony/maintenance"],
  ["movements", "Mouvements", "/patrimony/movements"],
  ["extensions", "Extensions", "/extensions"],
  ["settings", "Paramètres", "/settings"],
  ["users", "Utilisateurs", "/settings/users"],
  ["security", "Rôles et accès", "/settings/roles"],
] as const;

export type RoleCode = (typeof ROLE_CATALOG)[number]["code"];
export type ModuleCode = (typeof MODULE_CATALOG)[number][0];

const ROLE_ALIASES: Record<string, RoleCode> = {
  admin: "church_admin",
  admin_eglise: "admin_eglise",
  church_admin: "church_admin",
  pastor_titulaire: "pasteur_t",
  pasteur_titulaire: "pasteur_t",
  pastor: "pastor",
  pasteur: "pasteur_t",
  pasteur_t: "pasteur_t",
  pastor_assistant: "pasteur_a",
  assistant_pastor: "pasteur_a",
  pasteur_assistant: "pasteur_a",
  pasteur_a: "pasteur_a",
  charge_afp: "charge_afp",
  responsable_d: "responsable_d",
  department_leader: "responsable_d",
  logisticien: "logisticien",
  secretary: "secretaire",
  secretaire: "secretaire",
  worker: "worker",
  church_worker: "worker",
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

  return (
    ROLE_CATALOG.find((role) => role.code === code)?.label ||
    code
  );
}

export function getModuleDefinition(moduleCode: string) {
  const module = MODULE_CATALOG.find(
    ([code]) => code === moduleCode
  );

  if (!module) return null;

  return {
    code: module[0],
    label: module[1],
    href: module[2],
  };
}
