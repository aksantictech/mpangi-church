export const USER_ROLE_OPTIONS = [
  { value: "church_admin", label: "Admin Église" },
  { value: "pasteur_t", label: "Pasteur titulaire" },
  { value: "pasteur_a", label: "Pasteur assistant" },
  { value: "charge_afp", label: "Chargé AFP" },
  { value: "responsable_d", label: "Responsable de département" },
  { value: "logisticien", label: "Logisticien" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "worker", label: "Ouvrier / utilisateur" },
  { value: "readonly", label: "Lecture seule" },
] as const;

export type AppUserRole = (typeof USER_ROLE_OPTIONS)[number]["value"];

const USER_ROLE_VALUES = new Set<string>(
  USER_ROLE_OPTIONS.map((role) => role.value)
);

const USER_ROLE_ALIASES: Record<string, AppUserRole> = {
  admin: "church_admin",
  administrator: "church_admin",
  admin_eglise: "church_admin",
  owner: "church_admin",

  pastor: "pasteur_t",
  pasteur: "pasteur_t",
  pastor_titulaire: "pasteur_t",
  pasteur_titulaire: "pasteur_t",

  assistant_pastor: "pasteur_a",
  pastor_assistant: "pasteur_a",
  pasteur_assistant: "pasteur_a",

  afp_manager: "charge_afp",
  finance_manager: "charge_afp",
  administration_manager: "charge_afp",

  department_leader: "responsable_d",
  department_manager: "responsable_d",

  logistician: "logisticien",
  patrimony_manager: "logisticien",

  secretary: "secretaire",

  church_worker: "worker",
  ouvrier: "worker",
  member_manager: "worker",

  viewer: "readonly",
  member: "readonly",
};

export function normalizeUserRole(
  role: string | null | undefined
): AppUserRole {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (USER_ROLE_VALUES.has(normalized)) {
    return normalized as AppUserRole;
  }

  return USER_ROLE_ALIASES[normalized] || "worker";
}

export function getUserRoleLabel(
  role: string | null | undefined
) {
  const normalized = normalizeUserRole(role);

  return (
    USER_ROLE_OPTIONS.find((option) => option.value === normalized)?.label ||
    "Ouvrier / utilisateur"
  );
}

export function canCreateChurchUsers(
  role: string | null | undefined
) {
  const normalized = normalizeUserRole(role);

  return ["church_admin", "pasteur_t"].includes(normalized);
}

export function isDepartmentRole(
  role: string | null | undefined
) {
  return normalizeUserRole(role) === "responsable_d";
}
