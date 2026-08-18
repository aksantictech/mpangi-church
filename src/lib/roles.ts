export type ChurchRoleOption = {
  value: string;
  label: string;
  description: string;
};

export const CHURCH_ROLE_OPTIONS: ChurchRoleOption[] = [
  {
    value: "church_admin",
    label: "Admin Église",
    description: "Gestion complète de l’espace de l’église.",
  },
  {
    value: "pasteur_t",
    label: "Pasteur titulaire",
    description: "Pilotage pastoral et supervision.",
  },
  {
    value: "pasteur_a",
    label: "Pasteur assistant",
    description: "Suivi pastoral et accompagnement.",
  },
  {
    value: "charge_afp",
    label: "Chargé AFP",
    description: "Administration, finances et patrimoine selon autorisations.",
  },
  {
    value: "responsable_d",
    label: "Responsable de département",
    description: "Gestion du département ou service qui lui est confié.",
  },
  {
    value: "logisticien",
    label: "Logisticien",
    description: "Gestion logistique, matériel, patrimoine et mouvements.",
  },
  {
    value: "secretaire",
    label: "Secrétaire",
    description: "Courriers, transmissions, tâches et PV.",
  },
  {
    value: "worker",
    label: "Ouvrier / utilisateur",
    description: "Utilisateur opérationnel avec accès limité.",
  },
  {
    value: "readonly",
    label: "Lecture seule",
    description: "Consultation uniquement.",
  },
];

export const SUPER_ADMIN_ROLE_OPTIONS: ChurchRoleOption[] = [
  {
    value: "super_admin",
    label: "Super admin",
    description: "Administration globale de la plateforme.",
  },
  ...CHURCH_ROLE_OPTIONS,
];

export const CHURCH_ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "admin_eglise",
  "owner",
]);

export const PASTOR_ROLES = new Set([
  "pasteur_t",
  "pasteur",
  "pastor",
  "pasteur_titulaire",
  "pastor_titulaire",
  "pasteur_a",
  "pasteur_assistant",
  "pastor_assistant",
  "assistant_pastor",
]);

export const TITULAR_PASTOR_ROLES = new Set([
  "pasteur_t",
  "pasteur",
  "pastor",
  "pasteur_titulaire",
  "pastor_titulaire",
]);

export const ASSISTANT_PASTOR_ROLES = new Set([
  "pasteur_a",
  "pasteur_assistant",
  "pastor_assistant",
  "assistant_pastor",
]);

export const AFP_ROLES = new Set([
  "charge_afp",
  "afp_manager",
  "finance_manager",
  "administration_manager",
]);

export const SECRETARY_ROLES = new Set(["secretary", "secretaire"]);

export const LOGISTIC_ROLES = new Set([
  "logistician",
  "logisticien",
  "patrimony_manager",
]);

export const DEPARTMENT_ROLES = new Set([
  "department_manager",
  "department_leader",
  "responsable_d",
]);

export const WORKER_ROLES = new Set([
  "worker",
  "ouvrier",
  "member_manager",
  "church_worker",
]);

export const VIEWER_ROLES = new Set(["viewer", "readonly"]);

const ROLE_ALIASES: Record<string, string> = {
  admin: "church_admin",
  administrator: "church_admin",
  admin_eglise: "church_admin",
  owner: "church_admin",

  pastor: "pasteur_t",
  pasteur: "pasteur_t",
  pastor_titulaire: "pasteur_t",
  pasteur_titulaire: "pasteur_t",

  pastor_assistant: "pasteur_a",
  assistant_pastor: "pasteur_a",
  pasteur_assistant: "pasteur_a",

  afp_manager: "charge_afp",
  finance_manager: "charge_afp",
  administration_manager: "charge_afp",

  department_manager: "responsable_d",
  department_leader: "responsable_d",

  logistician: "logisticien",
  patrimony_manager: "logisticien",

  secretary: "secretaire",

  viewer: "readonly",
};

export const CHURCH_ROLE_VALUES = new Set(
  CHURCH_ROLE_OPTIONS.map((role) => role.value)
);

export const SUPER_ADMIN_ROLE_VALUES = new Set(
  SUPER_ADMIN_ROLE_OPTIONS.map((role) => role.value)
);

export function normalizeRole(role?: string | null) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function normalizeChurchRole(
  value: FormDataEntryValue | string | null
) {
  const raw = normalizeRole(String(value || ""));
  const normalized = ROLE_ALIASES[raw] || raw;

  if (CHURCH_ROLE_VALUES.has(normalized)) return normalized;

  return "readonly";
}

export function normalizeSuperAdminAssignableRole(
  value: FormDataEntryValue | string | null
) {
  const raw = normalizeRole(String(value || ""));
  const normalized = ROLE_ALIASES[raw] || raw;

  if (SUPER_ADMIN_ROLE_VALUES.has(normalized)) return normalized;

  return "readonly";
}

export function getRoleLabel(role?: string | null) {
  const value =
    normalizeSuperAdminAssignableRole(role || "readonly");

  return (
    SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "-"
  );
}
