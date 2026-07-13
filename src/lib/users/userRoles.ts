export const USER_ROLE_OPTIONS = [
  { value: "church_admin", label: "Admin Église" },
  { value: "pasteur_t", label: "Pasteur T" },
  { value: "pasteur_a", label: "Pasteur A" },
  { value: "charge_afp", label: "Chargé AFP" },
  { value: "responsable_d", label: "Responsable D" },
  { value: "logisticien", label: "Logisticien" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "worker", label: "Ouvrier / utilisateur" },
  { value: "readonly", label: "Lecture seule" },
] as const;

export type AppUserRole = (typeof USER_ROLE_OPTIONS)[number]["value"];

const USER_ROLE_VALUES = new Set<string>(
  USER_ROLE_OPTIONS.map((role) => role.value)
);

export function normalizeUserRole(role: string | null | undefined): AppUserRole {
  const normalized = String(role || "").trim().toLowerCase();

  if (USER_ROLE_VALUES.has(normalized)) {
    return normalized as AppUserRole;
  }

  const aliases: Record<string, AppUserRole> = {
    pastor: "pasteur_t",
    pasteur: "pasteur_t",
    assistant_pastor: "pasteur_a",
    admin_eglise: "church_admin",
    department_leader: "responsable_d",
    church_worker: "worker",
    viewer: "readonly",
  };

  return aliases[normalized] || "worker";
}

export function getUserRoleLabel(role: string | null | undefined) {
  const normalized = normalizeUserRole(role);

  return (
    USER_ROLE_OPTIONS.find((option) => option.value === normalized)?.label ||
    "Ouvrier / utilisateur"
  );
}

export function canCreateChurchUsers(role: string | null | undefined) {
  const normalized = String(role || "").trim().toLowerCase();

  return [
    "super_admin",
    "church_admin",
    "admin_eglise",
    "pasteur_t",
    "pastor",
  ].includes(normalized);
}
