export type ChurchRoleOption = {
  value: string;
  label: string;
  description: string;
};

export const CHURCH_ROLE_OPTIONS: ChurchRoleOption[] = [
  {
    value: "church_admin",
    label: "Admin Eglise",
    description: "Gestion complète de l’espace de l’église.",
  },
  {
    value: "pastor_titulaire",
    label: "Pasteur T",
    description: "Pasteur titulaire, suivi pastoral et supervision.",
  },
  {
    value: "pastor_assistant",
    label: "Pasteur A",
    description: "Pasteur assistant, suivi pastoral et accompagnement.",
  },
  {
    value: "afp_manager",
    label: "Chargé AFP",
    description: "Administration, finances et patrimoine selon autorisations.",
  },
  {
    value: "department_manager",
    label: "Responsable D",
    description: "Responsable de département ou service.",
  },
  {
    value: "logistician",
    label: "Logisticien",
    description: "Gestion logistique, matériel, patrimoine et mouvements.",
  },
  {
    value: "secretary",
    label: "Secrétaire",
    description: "Courriers, transmissions, tâches et PV.",
  },
  {
    value: "worker",
    label: "Ouvrier / utilisateur",
    description: "Utilisateur opérationnel avec accès limité.",
  },
  {
    value: "viewer",
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

export const CHURCH_ROLE_VALUES = new Set(
  CHURCH_ROLE_OPTIONS.map((role) => role.value)
);

export const SUPER_ADMIN_ROLE_VALUES = new Set(
  SUPER_ADMIN_ROLE_OPTIONS.map((role) => role.value)
);

export const CHURCH_ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "church_admin",
  "owner",
]);

export const PASTOR_ROLES = new Set([
  "pasteur",
  "pastor",
  "pastor_titulaire",
  "pastor_assistant",
]);

export function normalizeChurchRole(value: FormDataEntryValue | string | null) {
  const role = String(value || "").trim();

  if (CHURCH_ROLE_VALUES.has(role)) return role;

  return "viewer";
}

export function normalizeSuperAdminAssignableRole(
  value: FormDataEntryValue | string | null
) {
  const role = String(value || "").trim();

  if (SUPER_ADMIN_ROLE_VALUES.has(role)) return role;

  return "viewer";
}

export function getRoleLabel(role?: string | null) {
  const value = String(role || "").trim();

  return (
    SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === value)?.label ||
    legacyRoleLabel(value) ||
    value ||
    "-"
  );
}

function legacyRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Admin Eglise",
    administrator: "Admin Eglise",
    owner: "Admin Eglise",
    pasteur: "Pasteur T",
    pastor: "Pasteur T",
    administration_manager: "Secrétaire",
    finance_manager: "Chargé AFP",
    patrimony_manager: "Logisticien",
  };

  return labels[role] || "";
}
